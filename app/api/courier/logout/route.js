import { NextResponse } from 'next/server';
import { COURIER_COOKIE } from '@/lib/courierauth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COURIER_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}
