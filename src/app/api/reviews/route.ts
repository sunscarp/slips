import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { salonUid, sellerUid, buyerEmail, customerUid, rating, comment, serviceName, itemName, bookingId, requestId, buyerName } = body;

    const finalSellerUid = sellerUid || salonUid;
    const finalItemName = itemName || serviceName;
    const finalRequestId = requestId || bookingId;

    if (!finalSellerUid || !buyerEmail || !rating || rating < 1 || rating > 5 || !finalItemName || !finalRequestId) {
      const missing = [];
      if (!finalSellerUid) missing.push("seller");
      if (!buyerEmail) missing.push("buyerEmail");
      if (!rating || rating < 1 || rating > 5) missing.push("rating (1-5)");
      if (!finalItemName) missing.push("item name");
      if (!finalRequestId) missing.push("request ID");
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    // Check if this purchase request exists and is completed
    const bookingsCollection = db.collection("bookings");
    const request = await bookingsCollection.findOne({
      _id: new ObjectId(finalRequestId),
      $or: [
        { sellerUid: finalSellerUid },
        { salonUid: finalSellerUid }
      ],
      buyerEmail: buyerEmail.toLowerCase().trim(),
      status: { $in: ["completed", "shipped"] }
    });

    if (!request) {
      await client.close();
      return NextResponse.json({ error: "You can only review items from completed purchases" }, { status: 403 });
    }

    // Get seller details
    const salonsCollection = db.collection("salons");
    const seller = await salonsCollection.findOne({ uid: finalSellerUid });

    if (!seller) {
      await client.close();
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Check if buyer already reviewed this item for this request
    const reviewsCollection = db.collection("reviews");
    const existingReview = await reviewsCollection.findOne({
      salonUid: finalSellerUid,
      buyerEmail: buyerEmail.toLowerCase().trim(),
      serviceName: finalItemName,
      bookingId: finalRequestId
    });

    if (existingReview) {
      await client.close();
      return NextResponse.json({ error: "You have already reviewed this item for this purchase" }, { status: 409 });
    }

    const review = {
      salonUid: finalSellerUid,
      sellerUid: finalSellerUid,
      salonName: seller.name,
      sellerName: seller.name,
      buyerEmail: buyerEmail.toLowerCase().trim(),
      buyerName: buyerName || request.buyerName || "Anonymous",
      customerUid: customerUid || buyerEmail.toLowerCase().trim(),
      customerName: buyerName || request.buyerName || "Anonymous",
      rating: Number(rating),
      comment: comment || "",
      serviceName: finalItemName,
      itemName: finalItemName,
      employeeName: seller.name,
      bookingId: finalRequestId,
      requestId: finalRequestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await reviewsCollection.insertOne(review);
    await client.close();

    return NextResponse.json({ ok: true, reviewId: result.insertedId.toString() });
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salonUid = searchParams.get("salonUid");
    const customerUid = searchParams.get("customerUid");
    const serviceName = searchParams.get("serviceName");
    const isSystemAdmin = searchParams.get("systemAdmin") === "true";

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const reviewsCollection = db.collection("reviews");

    let query: any = {};
    
    if (isSystemAdmin) {
      // System admin can see all reviews across all salons
      // No restrictions applied
    } else {
      if (salonUid) query.salonUid = salonUid;
      if (customerUid) query.customerUid = customerUid;
      if (serviceName) query.serviceName = serviceName;
    }

    const reviews = await reviewsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    // Calculate average rating from the fetched reviews
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
      averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    }

    await client.close();

    return NextResponse.json({ 
      reviews, 
      averageRating,
      totalReviews: reviews.length 
    });
  } catch (error) {
    console.error('Review fetch error:', error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId, customerUid, rating, comment } = body;

    if (!reviewId || !customerUid) {
      return NextResponse.json({ error: "Review ID and customer UID are required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const reviewsCollection = db.collection("reviews");

    const updateFields: any = {
      updatedAt: new Date().toISOString()
    };

    if (rating !== undefined) updateFields.rating = Number(rating);
    if (comment !== undefined) updateFields.comment = comment;

    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(reviewId), customerUid },
      { $set: updateFields }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, updated: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("reviewId");
    const customerUid = searchParams.get("customerUid");
    const buyerEmail = searchParams.get("buyerEmail");
    const isSystemAdmin = searchParams.get("systemAdmin") === "true";

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const reviewsCollection = db.collection("reviews");

    let deleteQuery: any = { _id: new ObjectId(reviewId) };
    
    // System admin can delete any review without ownership check
    if (!isSystemAdmin) {
      if (buyerEmail) {
        deleteQuery.buyerEmail = buyerEmail.toLowerCase().trim();
      } else if (customerUid) {
        deleteQuery.customerUid = customerUid;
      } else {
        await client.close();
        return NextResponse.json({ error: "Buyer email or customer UID is required" }, { status: 400 });
      }
    }

    const result = await reviewsCollection.deleteOne(deleteQuery);

    await client.close();

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Review deletion error:', error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
