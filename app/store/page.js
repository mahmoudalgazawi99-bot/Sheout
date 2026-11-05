import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import StoreLogout from '@/components/storelogout';
import StoreOrderActions from '@/components/storeorderactions';
import AutoRefresh from '@/components/autorefresh';
import { sizeLabel, colorLabel } from '@/lib/i18n';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const money = (v) => `${Number(v).toFixed(2)} د.أ`;

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

function OrderCard({ so, showActions }) {
  const shortId = String(so.order_id).slice(0, 8).toUpperCase();
  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.line}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 14,
        marginBottom: 12,
      }}
    >
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

export default async function StoreHome() {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const storeName = (account.stores && (account.stores.name_ar || account.stores.name)) || '';

  const { data } = await supabaseAdmin
    .from('sub_orders')
    .select('id, order_id, status, subtotal, created_at, order_items(quantity, size, color, products(name, name_ar, images))')
    .eq('store_id', account.store_id)
    .order('created_at', { ascending: false })
    .limit(60);

  const orders = data ?? [];
  const byStatus = (s) => orders.filter((o) => o.status === s);
  const history = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
  const newCount = byStatus('new').length;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>{storeName}</h1>
        <StoreLogout />
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

      {orders.length === 0 && <p style={{ color: theme.muted }}>لسا ما وصلك أي طلب.</p>}

      {SECTIONS.map((sec) => {
        const list = byStatus(sec.key);
        if (list.length === 0) return null;
        return (
          <section key={sec.key} style={{ marginTop: 22 }}>
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
