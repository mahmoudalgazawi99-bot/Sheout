import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAll } from '@/lib/dbpage';
import { dayKey, toDate } from '@/lib/analytics';

const r2 = (n) => Math.round(n * 100) / 100;

export async function loadMyCash(courierId) {
  const [orders, handovers] = await Promise.all([
    fetchAll(() =>
      supabaseAdmin
        .from('orders')
        .select('id, order_no, delivery_fee, sub_orders(status, subtotal, delivered_at)')
        .eq('courier_id', courierId)
        .eq('status', 'delivered')
        .order('id', { ascending: true })
    ),
    fetchAll(() =>
      supabaseAdmin
        .from('cash_handovers')
        .select('id, amount, note, created_at')
        .eq('courier_id', courierId)
        .order('id', { ascending: true })
    ),
  ]);

  const today = dayKey(new Date());
  let collected = 0;
  let todayCollected = 0;
  const todayDeliveries = [];

  orders.forEach((o) => {
    const subs = (o.sub_orders ?? []).filter((s) => s.status !== 'cancelled');
    if (subs.length === 0) return;
    const amount = subs.reduce((s, x) => s + (Number(x.subtotal) || 0), 0) + (Number(o.delivery_fee) || 0);
    const times = subs.map((s) => (s.delivered_at ? toDate(s.delivered_at) : null)).filter(Boolean);
    const at = times.length ? new Date(Math.max(...times.map((d) => d.getTime()))) : null;
    collected += amount;
    if (at && dayKey(at) === today) {
      todayCollected += amount;
      todayDeliveries.push({ id: o.id, no: o.order_no || String(o.id).slice(0, 8).toUpperCase(), amount, at });
    }
  });

  let handed = 0;
  let todayHanded = 0;
  const list = [];
  handovers.forEach((h) => {
    const amt = Number(h.amount) || 0;
    const at = toDate(h.created_at);
    handed += amt;
    if (at && dayKey(at) === today) todayHanded += amt;
    list.push({ id: h.id, amount: amt, note: h.note, at });
  });
  list.sort((a, b) => (b.at ? b.at.getTime() : 0) - (a.at ? a.at.getTime() : 0));
  todayDeliveries.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    balance: r2(collected - handed),
    todayCollected: r2(todayCollected),
    todayHanded: r2(todayHanded),
    todayDeliveries,
    handovers: list.slice(0, 10),
  };
}
