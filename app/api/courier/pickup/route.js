import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession, canPickup } from '@/lib/courierauth';
import { stampsFor } from '@/lib/statusstamps';
import { refreshOrderStatus } from '@/lib/orderstatus';
import { sendToWarehouse } from '@/lib/push';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

async function notifyWarehouse(courier, pickedByOrder) {
  try {
    for (const [orderId, pickedIds] of Object.entries(pickedByOrder)) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('order_no, sub_orders(id, status, part_no, parts_total, picked_up_by, stores(name, name_ar))')
        .eq('id', orderId)
        .maybeSingle();
      if (!ord) continue;

      const active = (ord.sub_orders ?? [])
        .filter((s) => s.status !== 'cancelled')
        .sort((a, b) => (a.part_no || 0) - (b.part_no || 0));
      const mine = active.filter((s) => pickedIds.has(s.id));
      const others = active.filter(
        (s) => !pickedIds.has(s.id) && !(s.status === 'picked_up' && s.picked_up_by === courier.id)
      );

      const orderNo = ord.order_no || String(orderId).slice(0, 8).toUpperCase();
      const nm = (s) => (s.stores ? s.stores.name_ar || s.stores.name : '');
      const part = (s) => (s.parts_total > 1 ? `طرد ${s.part_no} من ${s.parts_total}` : 'طرد');

      let text = `#${orderNo} · مع ${courier.name}\n${mine.map((s) => `${part(s)} (${nm(s)})`).join('، ')}`;
      if (others.length > 0) {
        const list = others
          .slice(0, 3)
          .map((s) => `${nm(s)} (${s.status === 'picked_up' ? 'مع مندوب ثاني' : 'لسا عند المحل'})`)
          .join('، ');
        text += `\n⚠️ باقي ${others.length} من نفس الطلب مش مع هالمندوب: ${list}`;
      }

      await sendToWarehouse({ title: 'طرد بالطريق للمستودع', body: text, url: '/warehouse/receive' });
    }
  } catch {}
}

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
  const pickedByOrder = {};

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
      if (!pickedByOrder[s.order_id]) pickedByOrder[s.order_id] = new Set();
      pickedByOrder[s.order_id].add(s.id);
    }
  }

  if (done === 0) return fail('الطرود مش جاهزة للاستلام أو انستلمت قبل', 409);

  await Promise.all(Object.keys(pickedByOrder).map((oid) => refreshOrderStatus(oid)));
  await notifyWarehouse(courier, pickedByOrder);

  return NextResponse.json({ ok: true, count: done });
}
