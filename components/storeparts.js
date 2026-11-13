import StoreOrderActions from '@/components/storeorderactions';
import { sizeLabel, colorLabel } from '@/lib/i18n';
import { theme } from '@/lib/theme';

export const money = (v) => `${Number(v).toFixed(2)} د.أ`;

export function firstImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && first.url) return String(first.url);
  return null;
}

export function fmt(v) {
  const s = String(v);
  const hasTz = /(Z|[+-]\d{2}(:?\d{2})?)$/.test(s);
  const d = new Date(hasTz ? s : s + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ar-JO', { timeZone: 'Asia/Amman', dateStyle: 'short', timeStyle: 'short' });
}

export const HISTORY_LABEL = {
  picked_up: 'تم تسليمه للمنصة',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export const boxStyle = {
  background: theme.card,
  border: `1px solid ${theme.line}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadow,
  padding: 12,
};

export const chipStyle = (active) => ({
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 13,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  border: `1px solid ${active ? theme.ink : theme.line}`,
  background: active ? theme.ink : theme.card,
  color: active ? theme.gold : theme.ink,
});

export function StatCard({ label, value, sub, valueSize = 20, highlight = false }) {
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

export function StockGroup({ title, rows, showQty, color }) {
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
          <span>
            {p.name_ar || p.name}
            {p.product_no ? <span style={{ color: theme.muted, fontSize: 12 }}> · رقم {p.product_no}</span> : null}
          </span>
          {showQty && <b style={{ color }}>{Number(p.quantity) || 0} قطعة</b>}
        </div>
      ))}
    </div>
  );
}

export function OrderCard({ so, showActions }) {
  const orderNo = (so.orders && so.orders.order_no) || String(so.order_id).slice(0, 8).toUpperCase();
  return (
    <div style={{ ...boxStyle, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <b>
          طلب{' '}
          <bdi dir="ltr" style={{ color: theme.gold }}>
            {orderNo}
          </bdi>
        </b>
        <span style={{ fontSize: 12, color: theme.muted }}>{fmt(so.created_at)}</span>
      </div>

      {so.parts_total > 1 && (
        <div
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '4px 12px',
            borderRadius: 999,
            background: theme.goldSoft,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          الطرد {so.part_no} من {so.parts_total}
        </div>
      )}

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
              {p && p.product_no ? (
                <div style={{ fontSize: 12, color: theme.muted }}>رقم المنتج: {p.product_no}</div>
              ) : null}
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
