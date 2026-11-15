import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession, canPickup } from '@/lib/courierauth';
import { stampsFor } from '@/lib/statusstamps';
import { refreshOrderStatus } from '@/lib/orderstatus';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const courier = await getCourierSession();
  if (!courier) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);
  if (!canPickup(courier.role)) return fail('هذا الحساب ما إله صلاحية التوصيل', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const orderId = String(body.orderId || '');

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, courier_id, out_for_delivery_at')
    .eq('id', orderId)
    .maybeSingle();

  if (!order || order.courier_id !== courier.id || !order.out_for_delivery_at) {
    return fail('هذا الطلب مش إلك', 403);
  }

  const { data: subs } = await supabaseAdmin
    .from('sub_orders')
    .select('id, status, at_warehouse_at, confirmed_at, ready_at, picked_up_at, delivered_at')
    .eq('order_id', orderId);

  const active = (subs ?? []).filter((s) => s.status !== 'cancelled');
  const pending = active.filter((s) => s.status !== 'delivered');

  if (active.length === 0) return fail('هذا الطلب ملغي', 400);
  if (pending.length === 0) return fail('هذا الطلب موصّل مسبقاً', 400);
  if (pending.some((s) => s.status !== 'picked_up' || !s.at_warehouse_at)) {
    return fail('في طرود مش مسجّلة بالمستودع', 400);
  }

  const results = await Promise.all(
    pending.map((s) =>
      supabaseAdmin
        .from('sub_orders')
        .update(stampsFor('delivered', s))
        .eq('id', s.id)
        .eq('status', 'picked_up')
    )
  );
  if (results.some((r) => r.error)) return fail('تعذّر تحديث الطلب', 500);

  await refreshOrderStatus(orderId);
  return NextResponse.json({ ok: true });
}
