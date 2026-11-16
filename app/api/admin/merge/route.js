import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { dayKey, toDate } from '@/lib/analytics';
import { refreshOrderStatus } from '@/lib/orderstatus';

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });
const r2 = (n) => Math.round(n * 100) / 100;

export async function POST(request) {
  if (!(await isAdmin())) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح');
  }

  const primaryId = String(body.primaryId || '');
  const otherIds = (Array.isArray(body.otherIds) ? body.otherIds : [])
    .map(String)
    .filter((x) => x && x !== primaryId)
    .slice(0, 5);
  if (!primaryId || otherIds.length === 0) return fail('اختار الطلبات المراد دمجها');

  const ids = [primaryId, ...otherIds];
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_no, status, subtotal, delivery_fee, notes, created_at, packed_at, courier_id, customers(id, phone_norm), sub_orders(id, status, part_no)'
    )
    .in('id', ids);

  if (!orders || orders.length !== ids.length) return fail('بعض الطلبات غير موجودة');

  const primary = orders.find((o) => o.id === primaryId);
  const others = otherIds
    .map((id) => orders.find((o) => o.id === id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const keyOf = (o) => (o.customers ? o.customers.phone_norm || o.customers.id : '');
  const dayOf = (o) => {
    const d = toDate(o.created_at);
    return d ? dayKey(d) : '';
  };

  for (const o of orders) {
    if (o.status === 'delivered' || o.status === 'cancelled') return fail('في طلب منتهي أو ملغي');
    if (o.packed_at || o.courier_id) return fail('في طلب جُهّز أو عند مندوب، ما بيندمج');
    if (!keyOf(o) || keyOf(o) !== keyOf(primary)) return fail('الطلبات مش لنفس الزبون');
    if (dayOf(o) !== dayOf(primary)) return fail('الطلبات مش من نفس اليوم');
  }
  if (others.some((o) => new Date(o.created_at) < new Date(primary.created_at))) {
    return fail('الطلب الأساسي لازم يكون الأقدم');
  }

  const { error: aliasError } = await supabaseAdmin
    .from('order_aliases')
    .insert(others.map((o) => ({ old_id: o.id, old_no: o.order_no, new_id: primaryId })));
  if (aliasError) return fail('تعذّر تسجيل الدمج', 500);

  const { error: moveError } = await supabaseAdmin
    .from('sub_orders')
    .update({ order_id: primaryId })
    .in('order_id', otherIds);
  if (moveError) return fail('تعذّر نقل الطرود', 500);

  const ordered = [primary, ...others].flatMap((o) =>
    (o.sub_orders ?? []).slice().sort((a, b) => (a.part_no || 0) - (b.part_no || 0))
  );
  for (let i = 0; i < ordered.length; i++) {
    await supabaseAdmin
      .from('sub_orders')
      .update({ part_no: i + 1, parts_total: ordered.length })
      .eq('id', ordered[i].id);
  }

  const subtotal = r2(orders.reduce((s, o) => s + (Number(o.subtotal) || 0), 0));
  const fee = Number(primary.delivery_fee) || 0;
  const noteParts = [
    primary.notes,
    ...others.map((o) => `دُمج مع #${o.order_no}`),
    ...others.filter((o) => o.notes).map((o) => `ملاحظة #${o.order_no}: ${o.notes}`),
  ].filter(Boolean);

  const { error: updError } = await supabaseAdmin
    .from('orders')
    .update({ subtotal, total: r2(subtotal + fee), notes: noteParts.join(' | ').slice(0, 500) })
    .eq('id', primaryId);
  if (updError) return fail('تعذّر تحديث الطلب الأساسي', 500);

  await supabaseAdmin.from('orders').delete().in('id', otherIds);
  await refreshOrderStatus(primaryId);

  const saved = r2(others.reduce((s, o) => s + (Number(o.delivery_fee) || 0), 0));
  return NextResponse.json({ ok: true, saved });
}
