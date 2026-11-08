import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import StoreLogout from '@/components/storelogout';
import StoreOrderActions from '@/components/storeorderactions';
import AutoRefresh from '@/components/autorefresh';
import PushSetup from '@/components/pushsetup';
import StoreBell from '@/components/storebell';
import { computeStoreStats, computeStoreLive } from '@/lib/storestats';
import { computeStoreSpeed } from '@/lib/storespeed';
import { summarizeStock, LOW_STOCK } from '@/lib/stock';
import { sizeLabel, colorLabel } from '@/lib/i18n';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const money = (v) => `${Number(v).toFixed(2)} د.أ`;

const durAr = (m) => {
  if (m === null || m === undefined) return '—';
  const t = Math.round(m);
  if (t < 60) return `${t} دقيقة`;
  return `${Math.floor(t / 60)} س ${t % 60} د`;
};

const RANGES = [
  ['today', 'اليوم'],
  ['7', '7 أيام'],
  ['30', '30 يوم'],
  ['all', 'الكل'],
];

function firstImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && first.url) return String(first.url);
  return null;
}

function fmt(v) {
  const s = String(v);
  const hasTz = /(Z|[+-]\d{2}(:?\d{2})?)$/.test(s);
  const d = new Date(hasTz ? s : s + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ar-JO', { timeZone: 'Asia/Amman', dateStyle: 'short', timeStyle: 'short' });
}

const SECTIONS = [
  { key: 'new', title: 'طلبات جديدة', hint: 'اقبل الطلب لتأكيد توفر المنتج' },
  { key: 'confirmed', title: 'قيد التجهيز', hint: 'اضغط "جاهز للاستلام" لما تخلص التجهيز' },
  { key: 'ready', title: 'جاهزة للاستلام', hint: 'بانتظار مندوب المنصة' },
];

const HISTORY_LABEL = { delivered: 'تم التوصيل', cancelled: 'ملغي' };

const chip = (active) => ({
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 13,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  border: `1px solid ${active ? theme.ink : theme.line}`,
  background: active ? theme.ink : theme.card,
  color: active ? theme.gold : theme.ink,
});

const boxStyle = {
  background: theme.card,
  border: `1px solid ${theme.line}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadow,
  padding: 12,
};

function StatCard({ label, value, sub, valueSize = 20, highlight = false }) {
  return (
    <div
      style={{
        background: highlight ? theme.ink : theme.card,
        color: highlight ? theme.gold : theme.ink,
        border: `1px solid ${highlight ? theme.ink : theme.line}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: highlight ? theme.gold : theme.muted }}>{label}</div>
      <div style={{ fontSize: valueSize, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: highlight ? theme.gold : theme.muted, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

function StockGroup({ title, rows, showQty, color }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        {title} ({rows.length})
      </div>
      {rows.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            padding: '7px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
            fontSize: 14,
          }}
        >
          <span>{p.name_ar || p.name}</span>
          {showQty && <b style={{ color }}>{Number(p.quantity) || 0} قطعة</b>}
        </div>
      ))}
    </div>
  );
}

function OrderCard({ so, showActions }) {
  const shortId = String(so.order_id).slice(0, 8).toUpperCase();
  return (
    <div style={{ ...boxStyle, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>
          طلب <bdi style={{ color: theme.gold }}>#{shortId}</bdi>
        </b>
        <span style={{ fontSize: 12, color: theme.muted }}>{fmt(so.created_at)}</span>
      </div>

      {(so.order_items ?? []).map((it, idx) => {
        const p = it.products;
        const name = p ? p.name_ar || p.name : '';
        const details = [it.size ? sizeLabel('ar', it.size) : '', it.color ? colorLabel('ar', it.color) : '']
          .filter(Boolean)
          .join(' / ');
        return (
          <div
            key={idx}
            style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: `1px solid ${theme.line}`, marginTop: idx === 0 ? 10 : 0 }}
          >
            <img
              src={(p && firstImage(p.images)) || ''}
              alt={name}
              style={{ width: 56, height: 68, objectFit: 'cover', borderRadius: 10, background: theme.goldSoft }}
            />
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 14 }}>{name}</b>
              {details && <div style={{ fontSize: 13, color: theme.muted }}>{details}</div>}
              <div style={{ fontSize: 14, marginTop: 4 }}>
                الكمية: <b>{it.quantity}</b>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 13, color: theme.muted, marginTop: 6 }}>
        قيمة الطلب: <b style={{ color: theme.ink }}>{money(so.subtotal)}</b>
      </div>

      {showActions && <StoreOrderActions id={so.id} status={so.status} />}
    </div>
  );
}

export default async function StoreHome({ searchParams }) {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const sp = await searchParams;
  const rawRange = Array.isArray(sp?.range) ? sp.range[0] : sp?.range;
  const range = RANGES.some(([k]) => k === rawRange) ? rawRange : 'today';

  const storeName = (account.stores && (account.stores.name_ar || account.stores.name)) || '';

  const { data } = await supabaseAdmin
    .from('sub_orders')
    .select('id, order_id, status, subtotal, created_at, order_items(quantity, size, color, products(name, name_ar, images))')
    .eq('store_id', account.store_id)
    .order('created_at', { ascending: false })
    .limit(60);

  const { data: statsData } = await supabaseAdmin
    .from('sub_orders')
    .select('status, subtotal, created_at, confirmed_at, ready_at, order_items(quantity, price, products(name, name_ar))')
    .eq('store_id', account.store_id)
    .order('created_at', { ascending: false })
    .limit(1000);

  const { data: stockData } = await supabaseAdmin
    .from('products')
    .select('id, name, name_ar, quantity, status, order_items(count)')
    .eq('store_id', account.store_id);

  const orders = data ?? [];
  const stats = computeStoreStats(statsData ?? [], range);
  const live = computeStoreLive(statsData ?? []);
  const speed = computeStoreSpeed(statsData ?? [], range);
  const stock = summarizeStock(stockData ?? []);
  const maxQty = stats.top[0] ? stats.top[0].qty : 1;
  const hasStockAlerts = stock.out.length > 0 || stock.low.length > 0 || stock.never.length > 0;

  const byStatus = (s) => orders.filter((o) => o.status === s);
  const history = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
  const newCount = live.waiting;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>{storeName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StoreBell count={newCount}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {newCount > 0 ? `عندك ${newCount} طلب جديد بانتظار القبول` : 'ما في طلبات جديدة حالياً'}
            </div>
            {newCount > 0 && (
              <a
                href="#sec-new"
                style={{
                  display: 'inline-block',
                  padding: '9px 16px',
                  borderRadius: 999,
                  background: theme.ink,
                  color: theme.gold,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                عرض الطلبات الجديدة
              </a>
            )}
            <PushSetup publicKey={process.env.VAPID_PUBLIC_KEY || ''} />
          </StoreBell>
          <StoreLogout />
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: '12px 16px',
          borderRadius: theme.radius,
          background: newCount > 0 ? theme.ink : theme.goldSoft,
          color: newCount > 0 ? theme.gold : theme.ink,
          fontWeight: 600,
        }}
      >
        {newCount > 0 ? `عندك ${newCount} طلب جديد بانتظار القبول` : 'ما في طلبات جديدة حالياً'}
      </div>

      <section style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>الحالة الحالية</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <StatCard label="بانتظار القبول" value={live.waiting} />
          <StatCard label="قيد التجهيز" value={live.preparing} highlight={live.preparing > 0} />
          <StatCard label="جاهزة للاستلام" value={live.ready} />
        </div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 6 }}>
          هاي الأرقام الحالية لكل طلباتك، وما بتتأثر بالفترة اللي تحت.
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {RANGES.map(([k, label]) => (
            <Link key={k} href={`/store?range=${k}`} style={chip(k === range)}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 10 }}>
          <StatCard label="عدد الطلبات" value={stats.orders} />
          <StatCard label="مجموع قيمة الطلبات" value={money(stats.amount)} />
          <StatCard label="القطع المباعة" value={stats.pieces} />
          <StatCard
            label="الأكثر طلباً"
            value={stats.top[0] ? stats.top[0].name : '—'}
            sub={stats.top[0] ? `${stats.top[0].qty} قطعة` : ''}
            valueSize={16}
          />
          <StatCard label="متوسط وقت القبول" value={durAr(speed.accept)} valueSize={16} />
          <StatCard label="متوسط وقت التجهيز" value={durAr(speed.prep)} valueSize={16} />
        </div>

        {stats.top.length > 1 && (
          <div style={{ ...boxStyle, marginTop: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>أكثر المنتجات طلباً</div>
            {stats.top.map((p, i) => (
              <div key={p.name} style={{ marginBottom: i === stats.top.length - 1 ? 0 : 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <b>{p.qty} قطعة</b>
                </div>
                <div style={{ height: 6, background: theme.goldSoft, borderRadius: 3, marginTop: 4 }}>
                  <div
                    style={{
                      width: `${(p.qty / maxQty) * 100}%`,
                      height: '100%',
                      background: theme.gold,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 12, color: theme.muted, marginTop: 8, lineHeight: 1.7 }}>
          الإحصائيات بتستثني الطلبات الملغية. وقت القبول والتجهيز بيُحسب للطلبات اللي تغيّرت حالتها بعد تفعيل هالميزة.
        </div>
      </section>

      {hasStockAlerts && (
        <section style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>تنبيهات المخزون</div>
          <div style={boxStyle}>
            <StockGroup title="نفد المخزون" rows={stock.out} showQty color="#b00" />
            <StockGroup title={`مخزون منخفض (${LOW_STOCK} قطع أو أقل)`} rows={stock.low} showQty color="#b86a00" />
            <StockGroup title="منتجات ما انطلبت أبداً" rows={stock.never} showQty={false} />
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 12 }}>
              لتحديث الكميات تواصل مع إدارة المنصة.
            </div>
          </div>
        </section>
      )}

      {orders.length === 0 && <p style={{ color: theme.muted }}>لسا ما وصلك أي طلب.</p>}

      {SECTIONS.map((sec) => {
        const list = byStatus(sec.key);
        if (list.length === 0) return null;
        return (
          <section key={sec.key} id={`sec-${sec.key}`} style={{ marginTop: 22, scrollMarginTop: 80 }}>
            <h2 style={{ fontFamily: theme.serif, fontSize: 20, margin: 0 }}>
              {sec.title} ({list.length})
            </h2>
            <div style={{ fontSize: 13, color: theme.muted, margin: '2px 0 10px' }}>{sec.hint}</div>
            {list.map((so) => (
              <OrderCard key={so.id} so={so} showActions />
            ))}
          </section>
        );
      })}

      {history.length > 0 && (
        <details style={{ marginTop: 22 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>السجل ({history.length})</summary>
          <div style={{ marginTop: 10 }}>
            {history.map((so) => (
              <div key={so.id}>
                <div style={{ fontSize: 12, color: theme.muted, margin: '0 0 4px' }}>
                  {HISTORY_LABEL[so.status]}
                </div>
                <OrderCard so={so} showActions={false} />
              </div>
            ))}
          </div>
        </details>
      )}

      <p style={{ marginTop: 28, fontSize: 12, color: theme.muted, textAlign: 'center' }}>
        للمشاكل أو الاستفسارات تواصل مع إدارة المنصة.
      </p>
    </main>
  );
}
