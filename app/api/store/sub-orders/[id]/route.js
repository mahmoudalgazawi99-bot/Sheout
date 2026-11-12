import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { stampsFor } from '@/lib/statusstamps';
import { refreshOrderStatus } from '@/lib/orderstatus';
import { sendToAdmins, sendToCouriers } from '@/lib/push';

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
    .select('id, status, order_id, part_no, parts_total, confirmed_at, ready_at, picked_up_at, delivered_at')
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

  await refreshOrderStatus(updated.order_id);

  if (next === 'ready') {
    try {
      const storeName = (account.stores && (account.stores.name_ar || account.stores.name)) || '';

      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('order_no, courier_id')
        .eq('id', updated.order_id)
        .maybeSingle();
      const { data: st } = await supabaseAdmin
        .from('stores')
        .select('location, location_ar')
        .eq('id', account.store_id)
        .maybeSingle();
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('quantity')
        .eq('sub_order_id', id);

      const pieces = (items ?? []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
      const orderNo = (ord && ord.order_no) || String(updated.order_id).slice(0, 8).toUpperCase();
      const where = st ? st.location_ar || st.location || '' : '';
      const parts = sub.parts_total > 1 ? ` · طرد ${sub.part_no} من ${sub.parts_total}` : '';
      const text = `${storeName}${where ? ' · ' + where : ''} · #${orderNo}${parts} · ${pieces} قطعة`;

      await Promise.all([
        sendToAdmins({ title: 'طلب جاهز للاستلام', body: text, url: '/admin' }),
        sendToCouriers(
          { title: 'طلب جاهز للاستلام', body: text, url: '/courier' },
          ord && ord.courier_id ? ord.courier_id : null
        ),
      ]);
    } catch {}
  }

  return NextResponse.json({ ok: true, status: next });
}
