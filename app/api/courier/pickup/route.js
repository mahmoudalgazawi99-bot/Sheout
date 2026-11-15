import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession, canPickup } from '@/lib/courierauth';
import { stampsFor } from '@/lib/statusstamps';
import { refreshOrderStatus } from '@/lib/orderstatus';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const courier = await getCourierSession();
  if (!courier) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);
  if (!canPickup(courier.role)) return fail('هذا الحساب ما إله صلاحية الاستلام', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const ids = (Array.isArray(body.subOrderIds) ? body.subOrderIds : [body.subOrderId])
    .map((x) => String(x || ''))
    .filter(Boolean)
    .slice(0, 30);
  if (ids.length === 0) return fail('طلب غير صالح', 400);

  const { data: subs } = await supabaseAdmin
    .from('sub_orders')
    .select('id, status, order_id, confirmed_at, ready_at, picked_up_at, delivered_at')
    .in('id', ids);

  let done = 0;
  const orderIds = new Set();

  for (const s of subs ?? []) {
    if (s.status !== 'ready') continue;
    const { data: updated } = await supabaseAdmin
      .from('sub_orders')
      .update({ ...stampsFor('picked_up', s), picked_up_by: courier.id })
      .eq('id', s.id)
      .eq('status', 'ready')
      .select('id');
    if (updated && updated.length > 0) {
      done += 1;
      orderIds.add(s.order_id);
    }
  }

  if (done === 0) return fail('الطرود مش جاهزة للاستلام أو انستلمت قبل', 409);

  await Promise.all([...orderIds].map((oid) => refreshOrderStatus(oid)));
  return NextResponse.json({ ok: true, count: done });
}
