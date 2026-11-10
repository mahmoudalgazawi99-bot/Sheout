import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyPassword, dummyVerify } from '@/lib/storeauth';
import { COURIER_COOKIE, COURIER_SESSION_SECONDS, makeCourierToken } from '@/lib/courierauth';
import { clientKey, isLimited } from '@/lib/ratelimit';

export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'التطبيق غير مهيأ' }, { status: 500 });
  }

  if (await isLimited('courier-login:' + clientKey(request), 10, 600)) {
    return NextResponse.json({ error: 'محاولات كثيرة، جرّب بعد شوي' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const username = String(body.username || '').trim().toLowerCase().slice(0, 40);
  const password = String(body.password || '').slice(0, 100);
  if (!username || !password) {
    return NextResponse.json({ error: 'الرجاء إدخال اليوزر وكلمة السر' }, { status: 400 });
  }

  const { data: account } = await supabaseAdmin
    .from('courier_accounts')
    .select('id, password_hash, is_active')
    .eq('username', username)
    .maybeSingle();

  let ok = false;
  if (account && account.is_active) {
    ok = verifyPassword(password, account.password_hash);
  } else {
    dummyVerify(password);
  }

  if (!ok) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COURIER_COOKIE, makeCourierToken(account.id), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: COURIER_SESSION_SECONDS,
  });
  return res;
}
