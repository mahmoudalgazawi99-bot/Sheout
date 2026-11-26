import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { fetchAll } from '@/lib/dbpage';
import { dayKey, toDate } from '@/lib/analytics';
import { COMMISSION_RATE } from '@/lib/finance';

export const dynamic = 'force-dynamic';

const HEAD = [
  'order_no',
  'created_local',
  'member_no',
  'governorate',
  'area',
  'parcels',
  'stores',
  'pieces',
  'subtotal',
  'delivery_fee',
  'total',
  'status',
  'customer_confirmed',
  'confirmed_local',
  'cancelled_parcels',
  'accept_min_avg',
  'prep_min_avg',
  'pickup_to_warehouse_min_avg',
  'warehouse_min',
  'dispatch_min',
  'last_mile_min',
  'total_hours',
  'delivered_local',
  'commission_est',
  'revenue_est',
];

const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const local = (d) => (d ? d.toLocaleString('sv-SE', { timeZone: 'Asia/Amman', hour12: false }).slice(0, 16) : '');

const mins = (a, b) => {
  if (!a || !b) return null;
  const m = (b.getTime() - a.getTime()) / 60000;
  return m >= 0 ? Math.round(m * 10) / 10 : null;
};

const mean = (arr) => (arr.length ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10 : null);
const maxDate = (arr) => (arr.length ? new Date(Math.max(...arr.map((d) => d.getTime()))) : null);
const r2 = (n) => Math.round(n * 100) / 100;
const valid = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

export async function GET(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const today = dayKey(new Date());
  const from = valid(url.searchParams.get('from')) ? url.searchParams.get('from') : dayKey(new Date(Date.now() - 30 * 86400000));
  const to = valid(url.searchParams.get('to')) ? url.searchParams.get('to') : today;

  const fromIso = new Date(`${from}T00:00:00+03:00`).toISOString();
  const toIso = new Date(`${to}T23:59:59.999+03:00`).toISOString();

  let orders;
  try {
    orders = await fetchAll(() =>
      supabaseAdmin
        .from('orders')
        .select(
          'id, order_no, created_at, subtotal, delivery_fee, total, status, governorate, area, confirmed_at, packed_at, out_for_delivery_at, customers(member_no), sub_orders(status, store_id, subtotal, created_at, confirmed_at, ready_at, picked_up_at, at_warehouse_at, delivered_at, order_items(quantity))'
        )
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('id', { ascending: true })
    );
  } catch {
    return NextResponse.json({ error: 'read failed' }, { status: 500 });
  }

  const lines = [HEAD.join(',')];

  orders.forEach((o) => {
    const subs = o.sub_orders ?? [];
    const active = subs.filter((s) => s.status !== 'cancelled');
    const created = toDate(o.created_at);

    const acc = [];
    const prep = [];
    const pick = [];
    active.forEach((s) => {
      const a = mins(toDate(s.created_at), toDate(s.confirmed_at));
      if (a !== null) acc.push(a);
      const p = mins(toDate(s.confirmed_at), toDate(s.ready_at));
      if (p !== null) prep.push(p);
      const w = mins(toDate(s.picked_up_at), toDate(s.at_warehouse_at));
      if (w !== null) pick.push(w);
    });

    const lastAw = maxDate(active.map((s) => toDate(s.at_warehouse_at)).filter(Boolean));
    const lastDel = maxDate(active.map((s) => toDate(s.delivered_at)).filter(Boolean));
    const packed = toDate(o.packed_at);
    const out = toDate(o.out_for_delivery_at);

    const pieces = active.reduce(
      (n, s) => n + (s.order_items ?? []).reduce((m, it) => m + (Number(it.quantity) || 0), 0),
      0
    );
    const storesCount = new Set(active.map((s) => s.store_id)).size;

    const delivered = o.status === 'delivered';
    const deliveredSubtotal = active
      .filter((s) => s.status === 'delivered')
      .reduce((sum, s) => sum + (Number(s.subtotal) || 0), 0);
    const commission = delivered ? r2(deliveredSubtotal * COMMISSION_RATE) : 0;
    const revenue = delivered ? r2(commission + (Number(o.delivery_fee) || 0)) : 0;

    const totalMin = mins(created, lastDel);

    const row = [
      o.order_no,
      local(created),
      o.customers ? o.customers.member_no : '',
      o.governorate || '',
      o.area || '',
      active.length,
      storesCount,
      pieces,
      Number(o.subtotal) || 0,
      Number(o.delivery_fee) || 0,
      Number(o.total) || 0,
      o.status,
      o.confirmed_at ? 'yes' : 'no',
      local(toDate(o.confirmed_at)),
      subs.length - active.length,
      mean(acc),
      mean(prep),
      mean(pick),
      mins(lastAw, packed),
      mins(packed, out),
      mins(out, lastDel),
      totalMin === null ? '' : Math.round((totalMin / 60) * 10) / 10,
      local(lastDel),
      commission,
      revenue,
    ];
    lines.push(row.map(esc).join(','));
  });

  const csv = '\uFEFF' + lines.join('\r\n') + '\r\n';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sheout-orders-${from}_to_${to}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
