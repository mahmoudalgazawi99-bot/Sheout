import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession } from '@/lib/courierauth';

export async function POST(request) {
  const account = await getCourierSession();
  if (!account) return NextResponse.json({ error: 'انتهت الجلسة' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const endpoint = String((body && body.endpoint) || '');
  if (!endpoint) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  await supabaseAdmin
    .from('courier_push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('account_id', account.id);

  return NextResponse.json({ ok: true });
}
