import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { clientKey, isLimited } from '@/lib/ratelimit';
import { normalizePhone } from '@/lib/phone';

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

  const code = String(body.code || '')
    .trim()
    .replace(/^#/, '')
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[–—−‐]/g, '-')
    .replace(/\s+/g, '');
  const phone = normalizePhone(body.phone);

  if (!/^\d{8}-\d{1,10}-\d{1,4}$/.test(code) || phone.length < 5) return notFound();

  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, customers(phone, phone_norm)')
    .eq('order_no', code)
    .limit(1);

  let o = (data ?? [])[0];

  if (!o) {
    const { data: al } = await supabaseAdmin.from('order_aliases').select('new_id').eq('old_no', code).limit(1);
    const nid = al && al[0] ? al[0].new_id : null;
    if (nid) {
      const { data: d2 } = await supabaseAdmin
        .from('orders')
        .select('id, customers(phone, phone_norm)')
        .eq('id', nid)
        .limit(1);
      o = (d2 ?? [])[0];
    }
  }

  if (!o) return notFound();

  const c = o.customers || {};
  const ok = c.phone_norm === phone || normalizePhone(c.phone) === phone;
  if (!ok) return notFound();

  return NextResponse.json({ orderId: o.id });
}
