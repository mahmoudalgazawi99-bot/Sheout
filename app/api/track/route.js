import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { clientKey, isLimited } from '@/lib/ratelimit';
import { normPhone } from '@/lib/analytics';

const notFound = () => NextResponse.json({ error: 'not_found' }, { status: 404 });

export async function POST(request) {
  if (await isLimited('track-ip:' + clientKey(request), 20, 600)) {
    return NextResponse.json({ error: 'too_many' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const code = String(body.code || '').trim().replace(/^#/, '').toLowerCase();
  const phone = normPhone(body.phone);
  if (!/^[0-9a-f]{8}$/.test(code) || phone.length < 5) return notFound();

  const lo = `${code}-0000-0000-0000-000000000000`;
  const hi = `${code}-ffff-ffff-ffff-ffffffffffff`;

  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, customers(phone)')
    .gte('id', lo)
    .lte('id', hi)
    .limit(5);

  const match = (data ?? []).find(
    (o) => normPhone(o.customers && o.customers.phone) === phone
  );
  if (!match) return notFound();

  return NextResponse.json({ orderId: match.id });
}
