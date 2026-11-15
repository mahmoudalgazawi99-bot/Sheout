import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession, canWarehouse } from '@/lib/courierauth';
import { sendToWarehouse } from '@/lib/push';

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

  const subOrderId = String(body.subOrderId || '');

  const { data: sub } = await supabaseAdmin
    .from('sub_orders')
    .select('id, status, at_warehouse_at, order_id')
    .eq('id', subOrderId)
    .maybeSingle();

  if (!sub) return fail('الطرد غير موجود', 404);
  if (sub.status !== 'picked_up') return fail('هذا الطرد مش مع مندوب حالياً', 400);
  if (sub.at_warehouse_at) return fail('هذا الطرد مسجّل كواصل مسبقاً', 409);

  const { data: updated } = await supabaseAdmin
    .from('sub_orders')
    .update({ at_warehouse_at: new Date().toISOString(), received_by: staff.name })
    .eq('id', sub.id)
    .eq('status', 'picked_up')
    .is('at_warehouse_at', null)
    .select('id');

  if (!updated || updated.length === 0) return fail('تغيّرت حالة الطرد، حدّث الصفحة', 409);

  const { data: all } = await supabaseAdmin
    .from('sub_orders')
    .select('status, at_warehouse_at')
    .eq('order_id', sub.order_id);

  const active = (all ?? []).filter((s) => s.status !== 'cancelled');
  const complete = active.length > 0 && active.every((s) => s.status === 'picked_up' && s.at_warehouse_at);

  if (complete) {
    try {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('order_no')
        .eq('id', sub.order_id)
        .maybeSingle();
      const orderNo = (ord && ord.order_no) || String(sub.order_id).slice(0, 8).toUpperCase();
      await sendToWarehouse({
        title: 'طلب مكتمل بالمستودع',
        body: `#${orderNo} · كل الطرود وصلت · جاهز للتجهيز`,
        url: '/warehouse/pack',
      });
    } catch {}
  }

  return NextResponse.json({ ok: true, complete });
}
