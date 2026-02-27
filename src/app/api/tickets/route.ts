import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB;

// GET tickets
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raisedByUid = searchParams.get("raisedByUid");
    const isSystemAdmin = searchParams.get("systemAdmin") === "true";
    const ticketId = searchParams.get("ticketId");

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    let query: any = {};

    if (ticketId) {
      query._id = new ObjectId(ticketId);
    } else if (!isSystemAdmin && raisedByUid) {
      query.raisedByUid = raisedByUid;
    }
    // systemAdmin = true → fetch all tickets

    const tickets = await collection.find(query).sort({ createdAt: -1 }).toArray();

    await client.close();
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST a new ticket
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raisedByUid, raisedByName, raisedByEmail, raisedByRole, subject, description, bookingId } = body;

    if (!raisedByUid || !raisedByName || !raisedByRole || !subject || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    const ticket = {
      raisedByUid,
      raisedByName,
      raisedByEmail: raisedByEmail || '',
      raisedByRole, // 'buyer' | 'seller'
      subject,
      description,
      bookingId: bookingId || null,
      status: 'open', // 'open' | 'in_progress' | 'resolved' | 'closed'
      adminNotes: '',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(ticket);
    await client.close();

    return NextResponse.json({
      ok: true,
      ticket: { ...ticket, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

// PUT update ticket (admin reply, status change)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, status, adminNotes, message } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    const updateFields: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

    const updateOps: any = { $set: updateFields };

    // If a message is provided, push it to the messages array
    if (message) {
      updateOps.$push = {
        messages: {
          senderName: message.senderName,
          senderRole: message.senderRole, // 'admin' | 'buyer' | 'seller'
          text: message.text,
          createdAt: new Date().toISOString(),
        },
      };
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(ticketId) },
      updateOps
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, updated: result.modifiedCount > 0 });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// DELETE a ticket
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    const result = await collection.deleteOne({ _id: new ObjectId(ticketId) });
    await client.close();

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
