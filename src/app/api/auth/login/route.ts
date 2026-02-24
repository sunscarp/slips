import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich.' }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    await client.close();

    if (!user) {
      return NextResponse.json({ error: 'Kein Benutzer mit dieser E-Mail gefunden.' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Konto hat kein Passwort gesetzt. Bitte kontaktieren Sie den Administrator.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 });
    }

    const payload = {
      uid: user.uid,
      email: user.email,
      role: user.role ?? 'user',
      name: user.name ?? '',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const response = NextResponse.json(payload, { status: 200 });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler.' }, { status: 500 });
  }
}
