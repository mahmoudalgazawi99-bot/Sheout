import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession } from '@/lib/courierauth';
import { stampsFor } from '@/lib/statusstamps';
import { refreshOrderStatus } from '@/lib/orderstatus';

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

  const subOrderId = String(body.subOrderId || '');

  const { data: sub } = await supabaseAdmin
    .from('sub_orders')
    .select('id, status, order_id, confirmed_at, ready_at, picked_up_at, delivered_at')
    .eq('id', subOrderId)
    .maybeSingle();

  if (!sub) return fail('الطرد غير موجود', 404);
  if (sub.status !== 'ready') return fail('هذا الطرد مش جاهز للاستلام', 400);

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, courier_id')
    .eq('id', sub.order_id)
    .maybeSingle();

  if (!order) return fail('الطلب غير موجود', 404);
  if (order.courier_id && order.courier_id !== courier.id) {
    return fail('هذا الطلب عند مندوب ثاني', 409);
  }

  if (!order.courier_id) {
    const { data: claimed } = await supabaseAdmin
      .from('orders')
      .update({ courier_id: courier.id })
      .eq('id', order.id)
      .is('courier_id', null)
      .select('id');

    if (!claimed || claimed.length === 0) {
      const { data: again } = await supabaseAdmin
        .from('orders')
        .select('courier_id')
        .eq('id', order.id)
        .maybeSingle();
      if (!again || again.courier_id !== courier.id) {
        return fail('هذا الطلب صار عند مندوب ثاني', 409);
      }
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('sub_orders')
    .update(stampsFor('picked_up', sub))
    .eq('id', sub.id)
    .eq('status', 'ready')
    .select('id')
    .maybeSingle();

  if (error || !updated) return fail('تغيّرت حالة الطرد، حدّث الصفحة', 409);

  await refreshOrderStatus(sub.order_id);

  return NextResponse.json({ ok: true });
}
