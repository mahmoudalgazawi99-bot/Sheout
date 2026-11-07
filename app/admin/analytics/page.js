import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { computeAnalytics, LATE_HOURS } from '@/lib/analytics';
import { computeLive } from '@/lib/live';
import { Card, Section, BarList, ColumnChart } from '@/components/analyticsparts';
import AutoRefresh from '@/components/autorefresh';

export const dynamic = 'force-dynamic';

// When you decide on a commission, set it here (example: 0.15 for 15%).
const COMMISSION_RATE = null;

const RANGES = [
  ['today', 'Today'],
  ['7', '7 days'],
  ['30', '30 days'],
  ['all', 'All'],
];

const STATUS_ORDER = ['new', 'processing', 'delivered', 'cancelled'];

const jd = (v) => `${Number(v).toFixed(2)} JD`;
const num = (v) => String(v);
const hoursText = (h) => (h >= 24 ? `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h` : `${Math.floor(h)}h`);

export default async function AnalyticsPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const raw = Array.isArray(sp?.range) ? sp.range[0] : sp?.range;
  const range = RANGES.some(([k]) => k === raw) ? raw : 'today';

  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      'id, total, subtotal, delivery_fee, status, created_at, customers(phone), sub_orders(id, status, subtotal, store_id, stores(name), order_items(quantity, price, products(name, category)))'
    )
    .order('created_at', { ascending: false })
    .limit(1000);

  const orders = data ?? [];
  const a = computeAnalytics(orders, range);
  const live = computeLive(orders);

  const statusKeys = [
    ...STATUS_ORDER.filter((k) => a.statusCounts[k]),
    ...Object.keys(a.statusCounts).filter((k) => !STATUS_ORDER.includes(k)),
  ];

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 };

  const attention = (rows, emptyText) =>
    rows.length === 0 ? (
      <p style={{ color: '#777', margin: 0, fontSize: 14 }}>{emptyText}</p>
    ) : (
      rows.map((r, i) => (
        <Link
          key={i}
          href={`/admin/orders/${r.orderId}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderTop: i === 0 ? 'none' : '1px solid #f1f1f1',
            color: '#111',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          <span>
            #{String(r.orderId).slice(0, 8).toUpperCase()} · {r.store}
          </span>
          <b>{hoursText(r.hours)}</b>
        </Link>
      ))
    );

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <AutoRefresh seconds={30} />

      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to orders
      </Link>
      <h1>Analytics</h1>

      <div style={{ marginTop: 4 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Live now</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <Card label="Waiting for store" value={live.waiting} sub={`${live.waitingOrders} orders`} />
          <Card label="In preparation" value={live.preparing} sub={`${live.preparingOrders} orders`} />
          <Card label="Ready for pickup" value={live.ready} sub={`${live.readyOrders} orders`} />
        </div>
        <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>
          Current state of all orders, not affected by the period below. Counts are store parts of orders. Refreshes every 30 seconds.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
        {RANGES.map(([k, label]) => (
          <Link
            key={k}
            href={`/admin/analytics?range=${k}`}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 13,
              textDecoration: 'none',
              border: '1px solid #111',
              background: k === range ? '#111' : '#fff',
              color: k === range ? '#fff' : '#111',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {orders.length >= 1000 && (
        <p style={{ color: '#b00', fontSize: 13 }}>The analysis covers the latest 1000 orders only.</p>
      )}

      <div style={{ ...grid, marginTop: 16 }}>
        <Card label="Orders" value={a.count} sub={`${a.activeOrders} not cancelled`} />
        <Card label="Total sales" value={jd(a.totalSales)} sub="Products + delivery" />
        <Card label="Product sales" value={jd(a.productSales)} />
        <Card label="Delivery fees" value={jd(a.deliveryFees)} />
        <Card label="Average order" value={jd(a.avgOrder)} />
        <Card label="Pieces sold" value={a.pieces} />
        <Card label="Customers" value={a.customers} sub={`${a.newCustomers} new · ${a.repeatCustomers} repeat`} />
        <Card label="Cancellation rate" value={`${a.cancelRate}%`} />
        {COMMISSION_RATE !== null && (
          <Card
            label="Platform revenue"
            value={jd(a.productSales * COMMISSION_RATE + a.deliveryFees)}
            sub={`${Math.round(COMMISSION_RATE * 100)}% commission + delivery`}
          />
        )}
      </div>

      <Section title="Orders by status">
        {statusKeys.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>No orders in this period.</p>
        ) : (
          <BarList
            rows={statusKeys.map((k) => ({ label: k, value: a.statusCounts[k] }))}
            format={num}
          />
        )}
      </Section>

      {a.days.length > 1 && (
        <Section title="Sales per day">
          <ColumnChart
            items={a.days.map((d) => ({ label: d.key.slice(8), value: d.sales }))}
            format={jd}
            labelEvery={a.days.length > 15 ? 2 : 1}
          />
        </Section>
      )}

      <Section title="Peak hours (Amman time)">
        <ColumnChart
          items={a.hours.map((v, h) => ({ label: String(h), value: v }))}
          format={num}
          labelEvery={3}
        />
      </Section>

      <Section title="Store performance">
        {a.stores.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>No data.</p>
        ) : (
          <BarList
            rows={a.stores.map((s) => ({
              label: s.name,
              value: s.amount,
              note: `${s.orders} orders · ${s.pieces} pieces · ${s.cancelled} cancelled`,
            }))}
            format={jd}
          />
        )}
      </Section>

      <Section title="Top products (by pieces)">
        {a.products.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>No data.</p>
        ) : (
          <BarList
            rows={a.products.map((p) => ({ label: p.name, value: p.qty, note: jd(p.amount) }))}
            format={(v) => `${v} pcs`}
          />
        )}
      </Section>

      <Section title="Sales by category">
        {a.categories.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>No data.</p>
        ) : (
          <BarList
            rows={a.categories.map((c) => ({ label: c.name, value: c.amount, note: `${c.qty} pieces` }))}
            format={jd}
          />
        )}
      </Section>

      <Section title={`Waiting for the store over ${LATE_HOURS}h (all time)`}>
        {attention(a.lateNew, 'Nothing is waiting.')}
      </Section>

      <Section title="Ready for pickup (all time)">
        {attention(a.ready, 'Nothing is waiting for pickup.')}
      </Section>

      <p style={{ color: '#777', fontSize: 12, marginTop: 20, lineHeight: 1.7 }}>
        Sales exclude cancelled orders and cancelled store parts. Total sales = product sales + delivery fees.
        New customers = first order in this period. Repeat = more than one order overall.
      </p>
    </main>
  );
}
