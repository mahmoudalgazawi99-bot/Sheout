import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { COOKIE_NAME, makeToken, safeEqual } from '@/lib/adminauth';
import { clientKey, isLimited } from '@/lib/ratelimit';

const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

export async function POST(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'Admin is not configured' }, { status: 500 });
  }

  if (await isLimited('admin-login:' + clientKey(request), 10, 600)) {
    return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!safeEqual(hash(body.password || ''), hash(expected))) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
