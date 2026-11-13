import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { dayKey, toDate } from '@/lib/analytics';

export async function loadCourierOrders(accountId) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_no, delivery_fee, address, notes, created_at, courier_id, customers(name, phone), sub_orders(id, status, subtotal, part_no, parts_total, stores(name, name_ar, phone, location, location_ar), order_items(quantity, size, color, products(name, name_ar, product_no)))'
    )
    .not('status', 'in', '(delivered,cancelled)')
    .or(`courier_id.is.null,courier_id.eq.${accountId}`)
    .order('created_at', { ascending: true })
    .limit(100);

  const entries = [];
  (data ?? []).forEach((o) => {
    const subs = (o.sub_orders ?? [])
      .filter((s) => s.status !== 'cancelled')
      .sort((a, b) => (a.part_no || 0) - (b.part_no || 0));
    const pending = subs.filter((s) => s.status !== 'delivered');
    if (pending.length === 0) return;
    if (!pending.some((s) => s.status === 'ready' || s.status === 'picked_up')) return;

    const collect =
      subs.reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0) + (Number(o.delivery_fee) || 0);
    entries.push({
      o,
      subs,
      collect,
      mine: o.courier_id === accountId,
      allPicked: pending.every((s) => s.status === 'picked_up'),
    });
  });

  const deliverNow = entries.filter((e) => e.mine && e.allPicked);
  const toPickup = entries
    .filter((e) => !(e.mine && e.allPicked))
    .sort((a, b) => Number(b.mine) - Number(a.mine));

  return { deliverNow, toPickup };
}

export async function loadCourierHistory(accountId) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, delivery_fee, created_at, customers(name), sub_orders(status, subtotal, delivered_at)')
    .eq('courier_id', accountId)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(80);

  const rows = (data ?? []).map((o) => {
    const subs = (o.sub_orders ?? []).filter((s) => s.status !== 'cancelled');
    const amount =
      subs.reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0) + (Number(o.delivery_fee) || 0);
    const times = subs
      .map((s) => (s.delivered_at ? toDate(s.delivered_at) : null))
      .filter(Boolean)
      .map((d) => d.getTime());
    return {
      id: o.id,
      orderNo: o.order_no || String(o.id).slice(0, 8).toUpperCase(),
      customer: o.customers ? o.customers.name : '',
      amount,
      at: times.length ? new Date(Math.max(...times)) : null,
    };
  });

  const today = dayKey(new Date());
  const todayRows = rows.filter((r) => r.at && dayKey(r.at) === today);
  const earlier = rows.filter((r) => !(r.at && dayKey(r.at) === today)).slice(0, 20);
  const todayTotal = todayRows.reduce((sum, r) => sum + r.amount, 0);

  return { todayRows, earlier, todayTotal };
}
