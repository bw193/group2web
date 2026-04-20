import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { compareSync } from 'bcryptjs';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json() as any;

    if (!login || !password) {
      return NextResponse.json({ error: 'Login and password are required' }, { status: 400 });
    }

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, login), eq(users.username, login)))
      .limit(1);

    if (!user || !compareSync(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'Your account is pending admin approval. Please contact an administrator.' }, { status: 403 });
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Your registration has been declined.' }, { status: 403 });
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'editor',
      mustChangePassword: !!user.mustChangePassword,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
