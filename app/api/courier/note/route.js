import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession } from '@/lib/courierauth';
import { NOTE_TAGS } from '@/lib/feedback';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const courier = await getCourierSession();
  if (!courier) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const orderId = String(body.orderId || '');
  const tags = (Array.isArray(body.tags) ? body.tags.map(String) : [])
    .filter((t) => NOTE_TAGS.some(([k]) => k === t))
    .slice(0, 8);
  const note = String(body.note || '').trim().slice(0, 300);
  if (tags.length === 0 && !note) return fail('اختار وسم أو اكتب ملاحظة', 400);

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, courier_id, customer_id, sub_orders(status)')
    .eq('id', orderId)
    .maybeSingle();

  if (!order || order.courier_id !== courier.id) return fail('هذا الطلب مش إلك', 403);
  if (!(order.sub_orders ?? []).some((s) => s.status === 'delivered')) {
    return fail('بتقدر تكتب الملاحظة بعد التوصيل', 400);
  }

  const { data: existing } = await supabaseAdmin
    .from('customer_notes')
    .select('id')
    .eq('order_id', order.id)
    .eq('author_type', 'courier')
    .eq('author_id', courier.id)
    .maybeSingle();

  const row = { tags, note: note || null, updated_at: new Date().toISOString() };

  const { error } = existing
    ? await supabaseAdmin.from('customer_notes').update(row).eq('id', existing.id)
    : await supabaseAdmin.from('customer_notes').insert({
        ...row,
        customer_id: order.customer_id,
        order_id: order.id,
        author_type: 'courier',
        author_id: courier.id,
        author_name: courier.name,
      });

  if (error) return fail('تعذّر حفظ الملاحظة', 500);
  return NextResponse.json({ ok: true });
}
