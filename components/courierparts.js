import { toDate, normPhone } from '@/lib/analytics';
import { sizeLabel, colorLabel, money } from '@/lib/i18n';
import { theme } from '@/lib/theme';

export const jd = (v) => money('ar', v);

export const parcelOrderNo = (s) =>
  (s.orders && s.orders.order_no) || String(s.order_id).slice(0, 8).toUpperCase();

export const orderNoOf = (o) => o.order_no || String(o.id).slice(0, 8).toUpperCase();

function waLink(phone) {
  let d = normPhone(phone);
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '962' + d.slice(1);
  return d ? `https://wa.me/${d}` : '';
}

const mapLink = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export function ago(v) {
  const d = toDate(v);
  if (!d) return '';
  const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  return h < 24 ? `قبل ${h} ساعة` : `قبل ${Math.floor(h / 24)} يوم`;
}

export const box = {
  background: theme.card,
  border: `1px solid ${theme.line}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadow,
  padding: 14,
  marginBottom: 14,
};

const pill = {
  display: 'inline-block',
  border: `1px solid ${theme.line}`,
  borderRadius: 999,
  padding: '6px 14px',
  fontSize: 13,
  color: theme.ink,
  textDecoration: 'none',
  background: theme.card,
};

export function Contact({ phone, mapQuery, mapLabel }) {
  const wa = phone ? waLink(phone) : '';
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      {phone ? (
        <a href={`tel:${phone}`} style={pill}>
          اتصال
        </a>
      ) : null}
      {wa ? (
        <a href={wa} target="_blank" rel="noreferrer" style={pill}>
          واتساب
        </a>
      ) : null}
      {mapQuery ? (
        <a href={mapLink(mapQuery)} target="_blank" rel="noreferrer" style={pill}>
          {mapLabel}
        </a>
      ) : null}
    </div>
  );
}

export function Items({ items }) {
  return (items ?? []).map((it, idx) => {
    const p = it.products;
    const name = p ? p.name_ar || p.name : '';
    const d = [it.size ? sizeLabel('ar', it.size) : '', it.color ? colorLabel('ar', it.color) : '']
      .filter(Boolean)
      .join(' / ');
    return (
      <div key={idx} style={{ fontSize: 14, marginTop: 6 }}>
        {name} × {it.quantity}
        {p && p.product_no ? <span style={{ color: theme.muted, fontSize: 12 }}> · رقم {p.product_no}</span> : null}
        {d ? <span style={{ color: theme.muted, fontSize: 13 }}> ({d})</span> : null}
      </div>
    );
  });
}
