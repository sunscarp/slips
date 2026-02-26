import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB;

// Purchase Request API (formerly Booking)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sellerId, salonId,
      sellerUid, salonUid,
      items, services,
      total,
      buyerName, customerName,
      buyerEmail,
      buyerUid,
      shippingAddress,
      specialNeeds,
      status = 'pending'
    } = body;

    const finalSellerId = sellerId || salonId;
    const finalSellerUid = sellerUid || salonUid;
    const finalItems = items || services;
    const finalBuyerName = buyerName || customerName;

    if (!finalSellerId || !finalSellerUid || !finalItems || total === undefined || !finalBuyerName || !buyerEmail) {
      return NextResponse.json({ error: "Missing required purchase request information (sellerId, sellerUid, items, total, buyerName, buyerEmail)" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("bookings");

    const purchaseRequest = {
      sellerId: new ObjectId(finalSellerId),
      sellerUid: finalSellerUid,
      // Backward compat fields
      salonId: new ObjectId(finalSellerId),
      salonUid: finalSellerUid,
      items: finalItems,
      services: finalItems,
      total: Number(total),
      buyerName: finalBuyerName,
      customerName: finalBuyerName,
      buyerEmail: buyerEmail ? buyerEmail.toLowerCase().trim() : '',
      buyerUid: buyerUid || '',
      shippingAddress: shippingAddress || null,
      specialNeeds: specialNeeds || "",
      status, // pending, accepted, payment_pending, shipped, completed, rejected, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await collection.insertOne(purchaseRequest);
    await client.close();

    return NextResponse.json({
      ok: true,
      requestId: result.insertedId.toString(),
      bookingId: result.insertedId.toString(),
      purchaseRequest
    });
  } catch (error) {
    console.error('Purchase request creation error:', error);
    return NextResponse.json({ error: "Failed to create purchase request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerUid = searchParams.get("salonUid") || searchParams.get("sellerUid");
    const buyerEmail = searchParams.get("buyerEmail");
    const buyerUid = searchParams.get("buyerUid");
    const customerUid = searchParams.get("customerUid");
    const requestId = searchParams.get("bookingId") || searchParams.get("requestId");
    const isSystemAdmin = searchParams.get("systemAdmin") === "true";

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("bookings");

    let query: any = {};

    if (requestId) {
      query._id = new ObjectId(requestId);
    } else if (isSystemAdmin) {
      // System admin can see all purchase requests
    } else {
      if (sellerUid) {
        query.$or = [{ sellerUid }, { salonUid: sellerUid }];
      }
      if (buyerUid) query.buyerUid = buyerUid;
      if (buyerEmail) query.buyerEmail = buyerEmail.toLowerCase().trim();
      if (customerUid) query.customerUid = customerUid;
    }

    const requests = await collection.find(query).sort({ createdAt: -1 }).toArray();

    if (isSystemAdmin && requests.length > 0) {
      const sellersCollection = db.collection("salons");
      const sellerUids = [...new Set(requests.map(b => b.sellerUid || b.salonUid))];
      const sellers = await sellersCollection.find(
        { uid: { $in: sellerUids } },
        { projection: { uid: 1, name: 1, email: 1 } }
      ).toArray();

      const sellerMap = Object.fromEntries(sellers.map(s => [s.uid, s]));

      const enrichedRequests = requests.map(request => ({
        ...request,
        sellerInfo: sellerMap[request.sellerUid || request.salonUid] || null,
        salonInfo: sellerMap[request.sellerUid || request.salonUid] || null,
      }));

      await client.close();
      return NextResponse.json({ bookings: enrichedRequests });
    }

    await client.close();
    return NextResponse.json({ bookings: requests });
  } catch (error) {
    console.error('Purchase request fetch error:', error);
    return NextResponse.json({ error: "Failed to fetch purchase requests" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, requestId, status, ...updateData } = body;
    const id = requestId || bookingId;

    if (!id) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("bookings");

    const updateFields: any = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (status) {
      updateFields.status = status;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, updated: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Purchase request update error:', error);
    return NextResponse.json({ error: "Failed to update purchase request" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("bookingId") || searchParams.get("requestId");

    if (!id) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("bookings");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    await client.close();

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Purchase request deletion error:', error);
    return NextResponse.json({ error: "Failed to delete purchase request" }, { status: 500 });
  }
}