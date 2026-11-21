import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { dayKey, toDate } from '@/lib/analytics';

export const COMMISSION_RATE = 0.15;

const r2 = (n) => Math.round(n * 100) / 100;

async function fetchAll(build) {
  const out = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error || !data) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

const byTimeDesc = (a, b) => (b.at ? b.at.getTime() : 0) - (a.at ? a.at.getTime() : 0);

export async function loadCash() {
  const [orders, handovers, couriersRes] = await Promise.all([
    fetchAll(() =>
      supabaseAdmin
        .from('orders')
        .select('id, order_no, delivery_fee, courier_id, sub_orders(status, subtotal, delivered_at)')
        .eq('status', 'delivered')
        .not('courier_id', 'is', null)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
    ),
    fetchAll(() =>
      supabaseAdmin
        .from('cash_handovers')
        .select('id, courier_id, amount, note, created_at')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
    ),
    supabaseAdmin.from('courier_accounts').select('id, name, username, is_active, role'),
  ]);

  const today = dayKey(new Date());
  const map = {};
  const get = (id) => {
    if (!map[id]) {
      map[id] = { collected: 0, todayCollected: 0, handed: 0, todayHanded: 0, deliveries: [], handovers: [] };
    }
    return map[id];
  };

  orders.forEach((o) => {
    const subs = (o.sub_orders ?? []).filter((s) => s.status !== 'cancelled');
    if (subs.length === 0) return;
    const amount = subs.reduce((s, x) => s + (Number(x.subtotal) || 0), 0) + (Number(o.delivery_fee) || 0);
    const times = subs.map((s) => (s.delivered_at ? toDate(s.delivered_at) : null)).filter(Boolean);
    const at = times.length ? new Date(Math.max(...times.map((d) => d.getTime()))) : null;
    const e = get(o.courier_id);
    e.collected += amount;
    if (at && dayKey(at) === today) e.todayCollected += amount;
    e.deliveries.push({ id: o.id, no: o.order_no || String(o.id).slice(0, 8).toUpperCase(), amount, at });
  });

  handovers.forEach((h) => {
    const e = get(h.courier_id);
    const amt = Number(h.amount) || 0;
    const at = toDate(h.created_at);
    e.handed += amt;
    if (at && dayKey(at) === today) e.todayHanded += amt;
    e.handovers.push({ id: h.id, amount: amt, note: h.note, at });
  });

  return (couriersRes.data ?? [])
    .map((c) => {
      const e = map[c.id] || { collected: 0, todayCollected: 0, handed: 0, todayHanded: 0, deliveries: [], handovers: [] };
      return {
        id: c.id,
        name: c.name,
        username: c.username,
        active: c.is_active,
        role: c.role || 'both',
        collected: r2(e.collected),
        todayCollected: r2(e.todayCollected),
        handed: r2(e.handed),
        todayHanded: r2(e.todayHanded),
        balance: r2(e.collected - e.handed),
        deliveries: e.deliveries.sort(byTimeDesc).slice(0, 15),
        handovers: e.handovers.sort(byTimeDesc).slice(0, 10),
      };
    })
    .filter((c) => c.collected > 0 || c.handed > 0 || (c.active && c.role !== 'warehouse'));
}

export async function loadDues() {
  const [subs, payouts, storesRes] = await Promise.all([
    fetchAll(() =>
      supabaseAdmin
        .from('sub_orders')
        .select('id, store_id, subtotal, delivered_at')
        .eq('status', 'delivered')
        .order('id', { ascending: true })
    ),
    fetchAll(() =>
      supabaseAdmin
        .from('store_payouts')
        .select('id, store_id, amount, method, note, created_at')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
    ),
    supabaseAdmin.from('stores').select('id, name, name_ar'),
  ]);

  const today = dayKey(new Date());
  const map = {};
  const get = (id) => {
    if (!map[id]) map[id] = { sales: 0, todaySales: 0, count: 0, paid: 0, payouts: [] };
    return map[id];
  };

  subs.forEach((s) => {
    const e = get(s.store_id);
    const amt = Number(s.subtotal) || 0;
    const at = s.delivered_at ? toDate(s.delivered_at) : null;
    e.sales += amt;
    e.count += 1;
    if (at && dayKey(at) === today) e.todaySales += amt;
  });

  payouts.forEach((p) => {
    const e = get(p.store_id);
    const amt = Number(p.amount) || 0;
    e.paid += amt;
    e.payouts.push({ id: p.id, amount: amt, method: p.method, note: p.note, at: toDate(p.created_at) });
  });

  return (storesRes.data ?? [])
    .map((s) => {
      const e = map[s.id] || { sales: 0, todaySales: 0, count: 0, paid: 0, payouts: [] };
      const commission = r2(e.sales * COMMISSION_RATE);
      const net = r2(e.sales - commission);
      return {
        id: s.id,
        name: s.name_ar || s.name,
        sales: r2(e.sales),
        todaySales: r2(e.todaySales),
        count: e.count,
        commission,
        net,
        paid: r2(e.paid),
        balance: r2(net - e.paid),
        payouts: e.payouts.sort(byTimeDesc).slice(0, 10),
      };
    })
    .sort((a, b) => b.balance - a.balance);
}
