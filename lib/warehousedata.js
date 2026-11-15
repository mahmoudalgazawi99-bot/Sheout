import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ITEMS = 'order_items(quantity, size, color, products(name, name_ar, product_no))';

const byPart = (a, b) => (a.part_no || 0) - (b.part_no || 0);

export async function loadBoard() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      `id, order_no, created_at, packed_at, courier_id, status, customers(name, phone_norm), sub_orders(id, status, part_no, parts_total, at_warehouse_at, picked_up_by, stores(name, name_ar), ${ITEMS})`
    )
    .not('status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: true })
    .limit(150);

  const { data: couriers } = await supabaseAdmin.from('courier_accounts').select('id, name');
  const names = {};
  (couriers ?? []).forEach((c) => {
    names[c.id] = c.name;
  });

  const orders = data ?? [];
  const byPhone = {};
  orders.forEach((o) => {
    const k = o.customers && o.customers.phone_norm;
    if (k) {
      if (!byPhone[k]) byPhone[k] = [];
      byPhone[k].push(o);
    }
  });

  const incoming = [];
  const toPack = [];
  const packed = [];

  orders.forEach((o) => {
    const active = (o.sub_orders ?? []).filter((s) => s.status !== 'cancelled').sort(byPart);
    if (active.length === 0) return;

    const atWarehouse = (s) => s.status === 'picked_up' && !!s.at_warehouse_at;
    const arriving = active.filter((s) => s.status === 'picked_up' && !s.at_warehouse_at);
    const k = o.customers && o.customers.phone_norm;
    const siblings = k ? (byPhone[k] || []).filter((x) => x.id !== o.id) : [];
    const entry = { o, active, arriving, received: active.filter(atWarehouse).length, siblings, names };

    if (o.packed_at) packed.push(entry);
    else if (active.every(atWarehouse)) toPack.push(entry);
    else if (arriving.length > 0) incoming.push(entry);
  });

  return { incoming, toPack, packed };
}
