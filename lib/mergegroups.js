import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { dayKey, toDate } from '@/lib/analytics';

export async function loadMergeGroups() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_no, created_at, address, notes, total, delivery_fee, status, customers(id, name, phone, phone_norm, member_no), sub_orders(id, status)'
    )
    .not('status', 'in', '(delivered,cancelled)')
    .is('packed_at', null)
    .is('courier_id', null)
    .order('created_at', { ascending: true })
    .limit(200);

  const groups = {};
  (data ?? []).forEach((o) => {
    const c = o.customers;
    if (!c) return;
    const d = toDate(o.created_at);
    if (!d) return;
    const active = (o.sub_orders ?? []).filter((s) => s.status !== 'cancelled');
    if (active.length === 0) return;

    const key = `${c.phone_norm || c.id}|${dayKey(d)}`;
    if (!groups[key]) groups[key] = { key, customer: c, day: dayKey(d), orders: [] };
    groups[key].orders.push({ ...o, parcels: active.length });
  });

  return Object.values(groups).filter((g) => g.orders.length >= 2);
}
