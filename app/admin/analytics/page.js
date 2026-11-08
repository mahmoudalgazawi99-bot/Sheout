import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { computeAnalytics, LATE_HOURS } from '@/lib/analytics';
import { computeLive } from '@/lib/live';
import { computeSpeed } from '@/lib/speed';
import { summarizeStock, LOW_STOCK } from '@/lib/stock';
import { t, money, statusLabel } from '@/lib/i18n';
import { Card, Section, BarList, ColumnChart } from '@/components/analyticsparts';
import AutoRefresh from '@/components/autorefresh';

export const dynamic = 'force-dynamic';

const COMMISSION_RATE = 0.15;

const RANGES = [
  ['today', 'اليوم'],
  ['7', '7 أيام'],
  ['30', '30 يوم'],
  ['all', 'الكل'],
];

const STATUS_ORDER = ['new', 'processing', 'delivered', 'cancelled'];
const CATS = ['Women', 'Men', 'Kids', 'Shoes', 'Sports', 'Accessories'];

const jd = (v) => money('ar', v);
const num = (v) => String(v);
const pcs = (v) => `${v} قطعة`;
const hoursText = (h) =>
  h >= 24 ? `${Math.floor(h / 24)} يوم ${Math.floor(h % 24)} س` : `${Math.floor(h)} س`;
const dur = (m) => {
  if (m === null || m === undefined) return '—';
  const mins = Math.round(m);
  if (mins < 60) return `${mins} دقيقة`;
  return `${Math.floor(mins / 60)} س ${mins % 60} د`;
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
    .select('id, name, name_ar, quantity, status, stores(name, name_ar), order_items(count)');

  const { data: storeNames } = await supabaseAdmin.from('stores').select('name, name_ar');
  const { data: productNames } = await supabaseAdmin.from('products').select('name, name_ar');

  const storeAr = {};
  (storeNames ?? []).forEach((s) => {
    storeAr[s.name] = s.name_ar || s.name;
  });
  const productAr = {};
  (productNames ?? []).forEach((p) => {
    productAr[p.name] = p.name_ar || p.name;
  });
  const sn = (n) => storeAr[n] || n;
  const pn = (n) => productAr[n] || n;
  const cn = (c) => (CATS.includes(c) ? t('ar', c) : c);

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
            <bdi>#{String(r.orderId).slice(0, 8).toUpperCase()}</bdi> · {sn(r.store)}
          </span>
          <b>{hoursText(r.hours)}</b>
        </Link>
      ))
    );

  const stockRows = (list, showQty, color) =>
    list.map((p, i) => (
      <div key={p.id} style={rowStyle(i)}>
        <span>
          {p.name_ar || p.name} ·{' '}
          <span style={{ color: '#777' }}>{p.stores ? p.stores.name_ar || p.stores.name : '—'}</span>
        </span>
        {showQty && <b style={{ color }}>{Number(p.quantity) || 0} قطعة متبقية</b>}
      </div>
    ));

  const groupTitle = { fontWeight: 700, margin: '4px 0 6px', fontSize: 14 };
  const stockEmpty = stock.out.length === 0 && stock.low.length === 0 && stock.never.length === 0;
  const pctCommission = Math.round(COMMISSION_RATE * 100);

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <AutoRefresh seconds={30} />

      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → العودة إلى الطلبات
      </Link>
      <h1>التحليلات</h1>

      <div style={{ marginTop: 4 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>الوضع الحالي</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <Card label="بانتظار المحل" value={live.waiting} sub={`${live.waitingOrders} طلب`} />
          <Card label="قيد التجهيز" value={live.preparing} sub={`${live.preparingOrders} طلب`} />
          <Card label="جاهزة للاستلام" value={live.ready} sub={`${live.readyOrders} طلب`} />
        </div>
        <div style={{ fontSize: 12, color: '#777', marginTop: 6, lineHeight: 1.7 }}>
          الحالة الحالية لكل الطلبات، وما بتتأثر بالفترة اللي تحت. الأرقام بتعد أجزاء الطلبات لكل محل. وبتتحدث كل 30 ثانية.
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
        <p style={{ color: '#b00', fontSize: 13 }}>التحليل بيغطي آخر 1000 طلب بس.</p>
      )}

      <div style={{ ...grid, marginTop: 16 }}>
        <Card label="الطلبات" value={a.count} sub={`${a.activeOrders} غير ملغية`} />
        <Card label="إجمالي المبيعات" value={jd(a.totalSales)} sub="المنتجات + التوصيل" />
        <Card label="مبيعات المنتجات" value={jd(a.productSales)} />
        <Card label="رسوم التوصيل" value={jd(a.deliveryFees)} />
        <Card
          label="إيراد المنصة"
          value={jd(a.productSales * COMMISSION_RATE + a.deliveryFees)}
          sub={`عمولة ${pctCommission}% + التوصيل`}
        />
        <Card
          label="المستحق للمحلات"
          value={jd(a.productSales * (1 - COMMISSION_RATE))}
          sub={`${100 - pctCommission}% من مبيعات المنتجات`}
        />
        <Card label="متوسط الطلب" value={jd(a.avgOrder)} />
        <Card label="القطع المباعة" value={a.pieces} />
        <Card label="الزبائن" value={a.customers} sub={`${a.newCustomers} جديد · ${a.repeatCustomers} متكرر`} />
        <Card label="نسبة الإلغاء" value={`${a.cancelRate}%`} />
      </div>

      <Section title="الطلبات حسب الحالة">
        {statusKeys.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>ما في طلبات بهالفترة.</p>
        ) : (
          <BarList
            rows={statusKeys.map((k) => ({ label: statusLabel('ar', k), value: a.statusCounts[k] }))}
            format={num}
          />
        )}
      </Section>

      <Section title="السرعة">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <Card label="وقت القبول" value={dur(speed.overall.accept)} sub="من الطلب للقبول" />
          <Card label="وقت التجهيز" value={dur(speed.overall.prep)} sub="من القبول لجاهز" />
          <Card label="الاستلام والتوصيل" value={dur(speed.overall.pickup)} sub="من جاهز لتم التوصيل" />
        </div>

        {speed.stores.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={groupTitle}>المحلات، الأسرع بالقبول أولاً</div>
            {speed.stores.map((s, i) => (
              <div key={s.name} style={rowStyle(i)}>
                <span>
                  {i + 1}. {sn(s.name)}
                </span>
                <span>
                  <b>{dur(s.accept)}</b> قبول · <b>{dur(s.prep)}</b> تجهيز
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ color: '#777', fontSize: 12, margin: '12px 0 0', lineHeight: 1.7 }}>
          المتوسطات بالدقائق. بتُحسب بس للطلبات اللي تغيّرت حالتها بعد تفعيل هالميزة، فالطلبات القديمة ما بتدخل.
        </p>
      </Section>

      {a.days.length > 1 && (
        <Section title="المبيعات اليومية">
          <ColumnChart
            items={a.days.map((d) => ({ label: d.key.slice(8), value: d.sales }))}
            format={jd}
            labelEvery={a.days.length > 15 ? 2 : 1}
          />
        </Section>
      )}

      <Section title="أوقات الذروة (بتوقيت عمّان)">
        <ColumnChart
          items={a.hours.map((v, h) => ({ label: String(h), value: v }))}
          format={num}
          labelEvery={3}
        />
      </Section>

      <Section title="أداء المحلات">
        {a.stores.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>ما في بيانات.</p>
        ) : (
          <BarList
            rows={a.stores.map((s) => ({
              label: sn(s.name),
              value: s.amount,
              note: `${s.orders} طلب · ${s.pieces} قطعة · ${s.cancelled} ملغي`,
            }))}
            format={jd}
          />
        )}
      </Section>

      <Section title="أكثر المنتجات مبيعاً (بالقطع)">
        {a.products.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>ما في بيانات.</p>
        ) : (
          <BarList
            rows={a.products.map((p) => ({ label: pn(p.name), value: p.qty, note: jd(p.amount) }))}
            format={pcs}
          />
        )}
      </Section>

      <Section title="المبيعات حسب القسم">
        {a.categories.length === 0 ? (
          <p style={{ color: '#777', margin: 0 }}>ما في بيانات.</p>
        ) : (
          <BarList
            rows={a.categories.map((c) => ({ label: cn(c.name), value: c.amount, note: pcs(c.qty) }))}
            format={jd}
          />
        )}
      </Section>

      <Section title="تنبيهات المخزون">
        {stockEmpty ? (
          <p style={{ color: '#177a3c', margin: 0, fontSize: 14 }}>
            كل المنتجات متوفرة وانطلبت مرة وحدة على الأقل.
          </p>
        ) : (
          <div>
            {stock.out.length > 0 && (
              <div>
                <div style={groupTitle}>نفد المخزون ({stock.out.length})</div>
                {stockRows(stock.out, true, '#b00')}
              </div>
            )}
            {stock.low.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={groupTitle}>
                  مخزون منخفض ({LOW_STOCK} قطع أو أقل) ({stock.low.length})
                </div>
                {stockRows(stock.low, true, '#b86a00')}
              </div>
            )}
            {stock.never.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={groupTitle}>منتجات ما انطلبت أبداً ({stock.never.length})</div>
                {stockRows(stock.never, false)}
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title={`بانتظار المحل أكثر من ${LATE_HOURS} ساعة (كل الوقت)`}>
        {attention(a.lateNew, 'ما في شي بانتظار.')}
      </Section>

      <Section title="جاهزة للاستلام (كل الوقت)">
        {attention(a.ready, 'ما في شي بانتظار الاستلام.')}
      </Section>

      <p style={{ color: '#777', fontSize: 12, marginTop: 20, lineHeight: 1.8 }}>
        المبيعات بتستثني الطلبات الملغية وأجزاء المحلات الملغية. إجمالي المبيعات = مبيعات المنتجات + رسوم التوصيل.
        إيراد المنصة = العمولة على مبيعات المنتجات + رسوم التوصيل. الزبون الجديد = أول طلب إله بهالفترة، والمتكرر = أكثر من طلب بشكل عام.
        المنتج اللي "ما انطلب أبداً" يعني ما إله ولا سطر طلب، حتى الملغي.
      </p>
    </main>
  );
}
