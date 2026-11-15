import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { dayKey, toDate } from '@/lib/analytics';

const ITEMS = 'order_items(quantity, size, color, products(name, name_ar, product_no))';

const byPart = (a, b) => (a.part_no || 0) - (b.part_no || 0);

export async function loadPickup(courierId) {
  const { data } = await supabaseAdmin
    .from('sub_orders')
    .select(
      `id, status, part_no, parts_total, picked_up_by, at_warehouse_at, order_id, orders(order_no), stores(id, name, name_ar, phone, location, location_ar), ${ITEMS}`
    )
    .in('status', ['ready', 'picked_up'])
    .order('created_at', { ascending: true })
    .limit(300);

  const rows = data ?? [];
  const groups = {};
  rows
    .filter((s) => s.status === 'ready')
    .forEach((s) => {
      const key = s.stores ? s.stores.id : 'unknown';
      if (!groups[key]) groups[key] = { store: s.stores || {}, parcels: [] };
      groups[key].parcels.push(s);
    });

  return {
    stores: Object.values(groups),
    readyCount: rows.filter((s) => s.status === 'ready').length,
    carrying: rows.filter((s) => s.status === 'picked_up' && !s.at_warehouse_at && s.picked_up_by === courierId),
  };
}

export async function loadDelivery(courierId) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      `id, order_no, delivery_fee, address, notes, packed_at, courier_id, customers(name, phone), sub_orders(id, status, subtotal, part_no, parts_total, ${ITEMS})`
    )
    .not('packed_at', 'is', null)
    .not('status', 'in', '(delivered,cancelled)')
    .order('packed_at', { ascending: true })
    .limit(100);

  const available = [];
  const mine = [];

  (data ?? []).forEach((o) => {
    const subs = (o.sub_orders ?? []).filter((s) => s.status !== 'cancelled').sort(byPart);
    if (subs.length === 0 || subs.every((s) => s.status === 'delivered')) return;

    const collect =
      subs.reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0) + (Number(o.delivery_fee) || 0);
    const pieces = subs.reduce(
      (n, s) => n + (s.order_items ?? []).reduce((m, it) => m + (Number(it.quantity) || 0), 0),
      0
    );
    const entry = { o, subs, collect, pieces };

    if (!o.courier_id) available.push(entry);
    else if (o.courier_id === courierId) mine.push(entry);
  });

  return { available, mine };
}

export async function loadWarehouse() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      `id, order_no, created_at, packed_at, courier_id, sub_orders(id, status, part_no, parts_total, at_warehouse_at, stores(name, name_ar), ${ITEMS})`
    )
    .not('status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: true })
    .limit(150);

  const incoming = [];
  const toPack = [];
  const packed = [];

  (data ?? []).forEach((o) => {
    const active = (o.sub_orders ?? []).filter((s) => s.status !== 'cancelled').sort(byPart);
    if (active.length === 0) return;

    const atWarehouse = (s) => s.status === 'picked_up' && !!s.at_warehouse_at;
    const arriving = active.filter((s) => s.status === 'picked_up' && !s.at_warehouse_at);
    const entry = { o, active, arriving, received: active.filter(atWarehouse).length };

    if (o.packed_at) packed.push(entry);
    else if (active.every(atWarehouse)) toPack.push(entry);
    else if (arriving.length > 0) incoming.push(entry);
  });

  return { incoming, toPack, packed };
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
