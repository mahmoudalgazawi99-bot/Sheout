import { toDate, dayKey } from '@/lib/analytics';

function startKey(range, now) {
  if (range === 'all') return '';
  const days = range === 'today' ? 1 : Number(range);
  return dayKey(new Date(now.getTime() - (days - 1) * 86400000));
}

export function computeStoreLive(subOrders) {
  const live = { waiting: 0, preparing: 0, ready: 0 };
  (subOrders || []).forEach((so) => {
    if (so.status === 'new') live.waiting += 1;
    else if (so.status === 'confirmed') live.preparing += 1;
    else if (so.status === 'ready') live.ready += 1;
  });
  return live;
}

export function computeStoreStats(subOrders, range, now = new Date()) {
  const sk = startKey(range, now);
  let orders = 0;
  let amount = 0;
  let pieces = 0;
  const products = {};

  (subOrders || []).forEach((so) => {
    if (so.status === 'cancelled') return;
    const d = toDate(so.created_at);
    if (!d) return;
    if (sk && dayKey(d) < sk) return;

    orders += 1;
    amount += Number(so.subtotal) || 0;

    (so.order_items || []).forEach((it) => {
      const qty = Number(it.quantity) || 0;
      pieces += qty;
      const p = it.products;
      const name = p ? p.name_ar || p.name : '—';
      if (!products[name]) products[name] = { name, qty: 0, amount: 0 };
      products[name].qty += qty;
      products[name].amount += qty * (Number(it.price) || 0);
    });
  });

  const top = Object.values(products)
    .sort((a, b) => b.qty - a.qty || b.amount - a.amount)
    .slice(0, 3);

  return { orders, amount: Math.round(amount * 100) / 100, pieces, top };
}
