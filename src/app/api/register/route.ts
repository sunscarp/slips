import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB;

export async function POST(request: Request) {
  try {
    const userData = await request.json();

    if (!userData.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate uid if not provided
    const uid = userData.uid || randomUUID();
    const email = userData.email.toLowerCase().trim();

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    // Check if user already exists by email
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      await client.close();
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 12);
    }

    // Build the document (don't store plain password)
    const { password: _omit, uid: _uidOmit, ...rest } = userData;
    const userDoc = {
      ...rest,
      uid,
      email,
      ...(passwordHash ? { passwordHash } : {}),
    };

    const userResult = await db.collection('users').insertOne(userDoc);

    // If user is a salon, also insert into salons collection
    if (userData.role === 'salon') {
      await db.collection('salons').insertOne({
        ...userDoc,
        userId: userResult.insertedId,
      });
    }

    await client.close();

    return NextResponse.json(
      { success: true, userId: userResult.insertedId, uid },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    
    if (uid) {
      // Fetch single user by uid
      const user = await db.collection('users').findOne({ uid });
      await client.close();
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json(user, { status: 200 });
    } else {
      // Fetch all users
      const users = await db.collection('users').find({}).toArray();
      await client.close();
      
      return NextResponse.json({ users }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }
    
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    
    const result = await db.collection('users').deleteOne({ uid });
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}