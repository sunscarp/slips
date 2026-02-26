import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      uid: string;
      email: string;
      username: string;
      role: string;
      name: string;
    };

    return NextResponse.json({
      uid: payload.uid,
      email: payload.email,
      username: payload.username || '',
      role: payload.role,
      name: payload.name,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
