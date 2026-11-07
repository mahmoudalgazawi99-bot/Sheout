const TZ = 'Asia/Amman';

export const LATE_HOURS = 2;

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: 'numeric',
  hourCycle: 'h23',
});

const r2 = (n) => Math.round(n * 100) / 100;

export function toDate(v) {
  const s = String(v);
  const hasTz = /(Z|[+-]\d{2}(:?\d{2})?)$/.test(s);
  const d = new Date(hasTz ? s : s + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dayKey(d) {
  return dayFmt.format(d);
}

export function hourOf(d) {
  return Number(hourFmt.format(d)) || 0;
}

export function normPhone(p) {
  return String(p || '')
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/\D/g, '');
}

function rangeStartKey(range, now) {
  if (range === 'all') return '';
  const days = range === 'today' ? 1 : Number(range);
  return dayKey(new Date(now.getTime() - (days - 1) * 86400000));
}

export function computeAnalytics(orders, range, now = new Date()) {
  const startKey = rangeStartKey(range, now);

  const all = (orders || [])
    .map((o) => ({ ...o, _date: toDate(o.created_at) }))
    .filter((o) => o._date);

  const inRange = all.filter((o) => !startKey || dayKey(o._date) >= startKey);

  const firstSeen = {};
  const orderCountByPhone = {};
  all.forEach((o) => {
    const ph = normPhone(o.customers && o.customers.phone);
    if (!ph) return;
    orderCountByPhone[ph] = (orderCountByPhone[ph] || 0) + 1;
    if (!firstSeen[ph] || o._date < firstSeen[ph]) firstSeen[ph] = o._date;
  });

  const statusCounts = {};
  const dayMap = {};
  const hours = Array(24).fill(0);
  const storeMap = {};
  const productMap = {};
  const categoryMap = {};
  const phones = new Set();
  let productSales = 0;
  let deliveryFees = 0;
  let pieces = 0;
  let activeOrders = 0;

  inRange.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    hours[hourOf(o._date)] += 1;

    const ph = normPhone(o.customers && o.customers.phone);
    if (ph) phones.add(ph);

    const cancelled = o.status === 'cancelled';
    let orderSales = 0;

    (o.sub_orders || []).forEach((so) => {
      const sid = so.store_id;
      if (!storeMap[sid]) {
        storeMap[sid] = {
          name: (so.stores && so.stores.name) || '—',
          orders: 0,
          pieces: 0,
          amount: 0,
          cancelled: 0,
        };
      }
      const st = storeMap[sid];

      if (so.status === 'cancelled') {
        st.cancelled += 1;
        return;
      }

      const subtotal = Number(so.subtotal) || 0;
      st.orders += 1;
      st.amount += subtotal;
      orderSales += subtotal;

      (so.order_items || []).forEach((it) => {
        const qty = Number(it.quantity) || 0;
        const amt = qty * (Number(it.price) || 0);
        st.pieces += qty;
        pieces += qty;

        const pname = (it.products && it.products.name) || '—';
        if (!productMap[pname]) productMap[pname] = { name: pname, qty: 0, amount: 0 };
        productMap[pname].qty += qty;
        productMap[pname].amount += amt;

        const cname = (it.products && it.products.category) || '—';
        if (!categoryMap[cname]) categoryMap[cname] = { name: cname, qty: 0, amount: 0 };
        categoryMap[cname].qty += qty;
        categoryMap[cname].amount += amt;
      });
    });

    const fee = cancelled ? 0 : Number(o.delivery_fee) || 0;
    productSales += orderSales;
    deliveryFees += fee;
    if (!cancelled) activeOrders += 1;

    const dk = dayKey(o._date);
    if (!dayMap[dk]) dayMap[dk] = { key: dk, orders: 0, sales: 0 };
    dayMap[dk].orders += 1;
    dayMap[dk].sales += cancelled ? 0 : orderSales + fee;
  });

  let days = [];
  if (range === '7' || range === '30') {
    const n = Number(range);
    for (let i = n - 1; i >= 0; i--) {
      const k = dayKey(new Date(now.getTime() - i * 86400000));
      days.push(dayMap[k] || { key: k, orders: 0, sales: 0 });
    }
  } else if (range === 'all') {
    days = Object.keys(dayMap)
      .sort()
      .slice(-30)
      .map((k) => dayMap[k]);
  }
  days = days.map((d) => ({ ...d, sales: r2(d.sales) }));

  let newCustomers = 0;
  let repeatCustomers = 0;
  phones.forEach((ph) => {
    if (!startKey || dayKey(firstSeen[ph]) >= startKey) newCustomers += 1;
    if (orderCountByPhone[ph] > 1) repeatCustomers += 1;
  });

  const lateNew = [];
  const ready = [];
  all.forEach((o) => {
    if (o.status === 'cancelled') return;
    const waited = (now.getTime() - o._date.getTime()) / 3600000;
    (o.sub_orders || []).forEach((so) => {
      const row = { orderId: o.id, store: (so.stores && so.stores.name) || '—', hours: waited };
      if (so.status === 'new' && waited >= LATE_HOURS) lateNew.push(row);
      if (so.status === 'ready') ready.push(row);
    });
  });
  lateNew.sort((a, b) => b.hours - a.hours);
  ready.sort((a, b) => b.hours - a.hours);

  const totalSales = productSales + deliveryFees;
  const count = inRange.length;

  return {
    count,
    activeOrders,
    statusCounts,
    productSales: r2(productSales),
    deliveryFees: r2(deliveryFees),
    totalSales: r2(totalSales),
    avgOrder: activeOrders ? r2(totalSales / activeOrders) : 0,
    pieces,
    customers: phones.size,
    newCustomers,
    repeatCustomers,
    cancelRate: count ? Math.round(((statusCounts.cancelled || 0) / count) * 1000) / 10 : 0,
    days,
    hours,
    stores: Object.values(storeMap)
      .map((s) => ({ ...s, amount: r2(s.amount) }))
      .sort((a, b) => b.amount - a.amount),
    products: Object.values(productMap)
      .map((p) => ({ ...p, amount: r2(p.amount) }))
      .sort((a, b) => b.qty - a.qty || b.amount - a.amount)
      .slice(0, 5),
    categories: Object.values(categoryMap)
      .map((c) => ({ ...c, amount: r2(c.amount) }))
      .sort((a, b) => b.amount - a.amount),
    lateNew: lateNew.slice(0, 10),
    ready: ready.slice(0, 10),
  };
}
