import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { computeAnalytics, LATE_HOURS } from '@/lib/analytics';
import { computeLive } from '@/lib/live';
import { computeSpeed } from '@/lib/speed';
import { summarizeStock, LOW_STOCK } from '@/lib/stock';
import { Card, Section, BarList, ColumnChart } from '@/components/analyticsparts';
import AutoRefresh from '@/components/autorefresh';

export const dynamic = 'force-dynamic';

const COMMISSION_RATE = 0.15;

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
const dur = (m) => {
  if (m === null || m === undefined) return '—';
  const t = Math.round(m);
  if (t < 60) return `${t} min`;
  return `${Math.floor(t / 60)}h ${t % 60}m`;
};

export default async function AnalyticsPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const raw = Array.isArray(sp?.range) ? sp.range[0] : sp?.range;
  const range = RANGES.some(([k]) => k === raw) ? raw : 'today';

  const { data } = await supabaseAdmin
    .from('orders')
    .select(
      'id, total, subtotal, delivery_fee, status, created_at, customers(phone), sub_orders(id, status, subtotal, store_id, confirmed_at, ready_at, delivered_at, stores(name), order_items(quantity, price, products(name, category)))'
    )
    .order('created_at', { ascending: false })
    .limit(1000);

  const { data: stockData } = await supabaseAdmin
    .from('products')
    .select('id, name, quantity, status, stores(name), order_items(count)');

  const orders = data ?? [];
  const a = computeAnalytics(orders, range);
  const live = computeLive(orders);
  const speed = computeSpeed(orders, range);
  const stock = summarizeStock(stockData ?? []);

  const statusKeys = [
    ...STATUS_ORDER.filter((k) => a.statusCounts[k]),
    ...Object.keys(a.statusCounts).filter((k) => !STATUS_ORDER.includes(k)),
  ];

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 };
  const rowStyle = (i) => ({
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    padding: '8px 0',
    borderTop: i === 0 ? 'none' : '1px solid #f1f1f1',
    fontSize: 14,
  });

  const attention = (rows, emptyText) =>
    rows.length === 0 ? (
      <p style={{ color: '#777', margin: 0, fontSize: 14 }}>{emptyText}</p>
    ) : (
      rows.map((r, i) => (
        <Link
          key={i}
          href={`/admin/orders/${r.orderId}`}
          style={{ ...rowStyle(i), color: '#111', textDecoration: 'none' }}
        >
          <span>
            #{String(r.orderId).slice(0, 8).toUpperCase()} · {r.store}
          </span>
          <b>{hoursText(r.hours)}</b>
        </Link>
      ))
    );

  const stockRows = (list, showQty, color) =>
    list.map((p, i) => (
      <div key={p.id} style={rowStyle(i)}>
        <span>
          {p.name} · <span style={{ color: '#777' }}>{p.stores ? p.stores.name : '—'}</span>
        </span>
        {showQty && <b style={{ color }}>{Number(p.quantity) || 0} left</b>}
      </div>
    ));

  const groupTitle = { fontWeight: 700, margin: '4px 0 6px', fontSize: 14 };
  const stockEmpty = stock.out.length === 0 && stock.low.length === 0 && stock.never.length === 0;

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
        <Card
          label="Platform revenue"
          value={jd(a.productSales * COMMISSION_RATE + a.deliveryFees)}
          sub={`${Math.round(COMMISSION_RATE * 100)}% commission + delivery`}
        />
        <Card
          label="Owed to stores"
          value={jd(a.productSales * (1 - COMMISSION_RATE))}
          sub={`${Math.round((1 - COMMISSION_RATE) * 100)}% of product sales`}
        />
        <Card label="Average order" value={jd(a.avgOrder)} />
        <Card label="Pieces sold" value={a.pieces} />
        <Card label="Customers" value={a.customers} sub={`${a.newCustomers} new · ${a.repeatCustomers} repeat`} />
        <Card label="Cancellation rate" value={`${a.cancelRate}%`} />
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

      <Section title="Speed">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <Card label="Accept time" value={dur(speed.overall.accept)} sub="Order to accepted" />
          <Card label="Prep time" value={dur(speed.overall.prep)} sub="Accepted to ready" />
          <Card label="Pickup to delivery" value={dur(speed.overall.pickup)} sub="Ready to delivered" />
        </div>

        {speed.stores.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={groupTitle}>Stores, fastest to accept first</div>
            {speed.stores.map((s, i) => (
              <div key={s.name} style={rowStyle(i)}>
                <span>
                  {i + 1}. {s.name}
                </span>
                <span>
                  <b>{dur(s.accept)}</b> accept · <b>{dur(s.prep)}</b> prep
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ color: '#777', fontSize: 12, margin: '12px 0 0', lineHeight: 1.7 }}>
          Averages in minutes. Tracked only for orders whose status changed after this feature was added, so older orders are not included.
        </p>
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

      <Section title="Stock alerts">
        {stockEmpty ? (
          <p style={{ color: '#177a3c', margin: 0, fontSize: 14 }}>Everything is in stock and has been ordered at least once.</p>
        ) : (
          <div>
            {stock.out.length > 0 && (
              <div>
                <div style={groupTitle}>Out of stock ({stock.out.length})</div>
                {stockRows(stock.out, true, '#b00')}
              </div>
            )}
            {stock.low.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={groupTitle}>
                  Low stock, {LOW_STOCK} or fewer ({stock.low.length})
                </div>
                {stockRows(stock.low, true, '#b86a00')}
              </div>
            )}
            {stock.never.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={groupTitle}>Never ordered ({stock.never.length})</div>
                {stockRows(stock.never, false)}
              </div>
            )}
          </div>
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
        Platform revenue = commission on product sales + delivery fees. New customers = first order in this period.
        Repeat = more than one order overall. Never ordered = no order line at all, cancelled or not.
      </p>
    </main>
  );
}
