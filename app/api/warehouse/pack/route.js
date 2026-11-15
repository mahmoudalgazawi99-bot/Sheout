import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession, canWarehouse } from '@/lib/courierauth';
import { sendToCouriers } from '@/lib/push';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const staff = await getCourierSession();
  if (!staff) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);
  if (!canWarehouse(staff.role)) return fail('هذا الحساب ما إله صلاحية المستودع', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const orderId = String(body.orderId || '');

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, packed_at')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return fail('الطلب غير موجود', 404);
  if (order.packed_at) return fail('هذا الطلب مجهّز مسبقاً', 409);

  const { data: subs } = await supabaseAdmin
    .from('sub_orders')
    .select('status, at_warehouse_at')
    .eq('order_id', orderId);

  const active = (subs ?? []).filter((s) => s.status !== 'cancelled');
  if (active.length === 0) return fail('هذا الطلب ملغي', 400);
  if (!active.every((s) => s.status === 'picked_up' && s.at_warehouse_at)) {
    return fail('لسا في طرود ما وصلت للمستودع', 400);
  }

  const { data: updated } = await supabaseAdmin
    .from('orders')
    .update({ packed_at: new Date().toISOString(), packed_by: staff.name })
    .eq('id', orderId)
    .is('packed_at', null)
    .select('id');

  if (!updated || updated.length === 0) return fail('تغيّرت حالة الطلب، حدّث الصفحة', 409);

  try {
    const orderNo = order.order_no || String(order.id).slice(0, 8).toUpperCase();
    await sendToCouriers({
      title: 'طلب جاهز للتوصيل',
      body: `#${orderNo} · ${active.length} ${active.length === 1 ? 'طرد' : 'طرود'} · جاهز بالمستودع`,
      url: '/courier/deliver',
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
