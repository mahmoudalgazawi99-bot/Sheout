import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { stampsFor } from '@/lib/statusstamps';

const NEXT = { new: 'confirmed', confirmed: 'ready' };

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function PATCH(request, { params }) {
  const account = await getStoreSession();
  if (!account) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  const { id } = await params;

  let body = {};
  try {
    body = await request.json();
  } catch {}

  const { data: sub } = await supabaseAdmin
    .from('sub_orders')
    .select('id, status, order_id, confirmed_at, ready_at, delivered_at')
    .eq('id', id)
    .eq('store_id', account.store_id)
    .maybeSingle();

  if (!sub) return fail('الطلب غير موجود', 404);

  const next = NEXT[sub.status];
  if (!next) return fail('لا يمكن تغيير حالة هذا الطلب', 400);
  if (body.status && body.status !== next) return fail('انتقال غير مسموح', 400);

  const { data: updated, error } = await supabaseAdmin
    .from('sub_orders')
    .update(stampsFor(next, sub))
    .eq('id', id)
    .eq('status', sub.status)
    .select('order_id')
    .maybeSingle();

  if (error || !updated) return fail('تغيّرت حالة الطلب، حدّث الصفحة', 409);

  const { data: siblings } = await supabaseAdmin
    .from('sub_orders')
    .select('status')
    .eq('order_id', updated.order_id);

  const all = (siblings ?? []).map((s) => s.status);
  let orderStatus = 'new';
  if (all.length > 0 && all.every((s) => s === 'delivered')) orderStatus = 'delivered';
  else if (all.length > 0 && all.every((s) => s === 'cancelled')) orderStatus = 'cancelled';
  else if (all.some((s) => s !== 'new')) orderStatus = 'processing';

  await supabaseAdmin.from('orders').update({ status: orderStatus }).eq('id', updated.order_id);

  return NextResponse.json({ ok: true, status: next });
}
