import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB;

// GET messages for a booking
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("messages");

    const messages = await collection
      .find({ bookingId })
      .sort({ createdAt: 1 })
      .toArray();

    await client.close();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST a new message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, senderUid, senderName, senderRole, text, type } = body;

    if (!bookingId || !senderUid || !senderName || !senderRole || !text) {
      return NextResponse.json({ error: "Missing required fields (bookingId, senderUid, senderName, senderRole, text)" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("messages");

    const message = {
      bookingId,
      senderUid,
      senderName,
      senderRole, // 'buyer' | 'seller'
      text,
      type: type || 'text', // 'text' | 'payment_info' | 'payment_confirmed' | 'system'
      createdAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(message);
    await client.close();

    return NextResponse.json({
      ok: true,
      message: { ...message, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
