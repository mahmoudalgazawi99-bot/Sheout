import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const account = await getStoreSession();
  if (!account) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const endpoint = String((body && body.endpoint) || '');
  const p256dh = String((body && body.keys && body.keys.p256dh) || '');
  const auth = String((body && body.keys && body.keys.auth) || '');

  if (!endpoint.startsWith('https://') || endpoint.length > 1000 || !p256dh || !auth) {
    return fail('بيانات الاشتراك غير صالحة', 400);
  }

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert({ account_id: account.id, endpoint, p256dh, auth }, { onConflict: 'endpoint' });

  if (error) return fail('تعذّر حفظ الاشتراك', 500);
  return NextResponse.json({ ok: true });
}
