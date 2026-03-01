import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;
    // Support login by username or email
    const identifier = (body.username || body.email || '').toLowerCase().trim();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Benutzername/E-Mail und Passwort erforderlich.' }, { status: 400 });
    }

    // Hardcoded admin bypass
    if (identifier === 'admin@gmail.com' && password === 'admin123') {
      const payload = { uid: 'hardcoded-admin', email: 'admin@gmail.com', username: 'admin', role: 'admin', name: 'Admin' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      const response = NextResponse.json(payload, { status: 200 });
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    // Try to find by username first, then by email
    let user = await db.collection('users').findOne({ username: identifier });
    if (!user) {
      user = await db.collection('users').findOne({ email: identifier });
    }
    await client.close();

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 401 });
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
      email: user.email || '',
      username: user.username || '',
      role: user.role ?? 'buyer',
      name: user.name ?? user.username ?? '',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const response = NextResponse.json(payload, { status: 200 });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false,
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
