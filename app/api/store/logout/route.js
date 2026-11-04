import { NextResponse } from 'next/server';
import { STORE_COOKIE } from '@/lib/storeauth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STORE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}
