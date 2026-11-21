import { theme } from '@/lib/theme';
import { toDate } from '@/lib/analytics';
import { t, money } from '@/lib/i18n';

const TOPIC_AR = {
  stock: 'تحديث كمية',
  price: 'تعديل سعر',
  payout: 'مستحقات ودفعات',
  order: 'استفسار عن طلب',
  other: 'رسالة',
  product: 'منتج جديد',
  reply: 'رد',
};

const STATUS_AR = { pending: 'بانتظار المراجعة', approved: 'تم النشر', rejected: 'مرفوض' };
const STATUS_COLOR = { pending: '#b86a00', approved: '#177a3c', rejected: '#b00' };

function fmt(v) {
  const d = toDate(v);
  return d ? d.toLocaleString('ar-JO', { timeZone: 'Asia/Amman', dateStyle: 'short', timeStyle: 'short' }) : '';
}

export function Bubble({ m, viewer, children }) {
  const mine = m.sender === viewer;
  const p = m.payload || {};
  const isProduct = m.kind === 'product_request';

  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
      <div
        style={{
          maxWidth: '86%',
          background: mine ? theme.ink : theme.card,
          color: mine ? theme.bg : theme.ink,
          border: mine ? 'none' : `1px solid ${theme.line}`,
          borderRadius: 16,
          padding: '10px 14px',
          boxShadow: theme.shadow,
          textAlign: 'start',
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
          {m.sender_name || (m.sender === 'admin' ? 'الإدارة' : 'المحل')}
          {' · '}
          {isProduct ? TOPIC_AR.product : TOPIC_AR[m.topic] || ''}
          {' · '}
          {fmt(m.created_at)}
        </div>

        {isProduct ? (
          <div style={{ fontSize: 14, lineHeight: 1.8 }}>
            <b>{p.name_ar}</b>
            {p.name_en ? <span dir="ltr"> ({p.name_en})</span> : null}
            <div>
              {t('ar', p.category)} · {money('ar', p.price)}
              {p.sale_price ? ` · بعد التخفيض ${money('ar', p.sale_price)}` : ''} · الكمية {p.quantity}
            </div>
            {p.sizes && p.sizes.length > 0 ? <div>المقاسات: {p.sizes.join('، ')}</div> : null}
            {p.colors && p.colors.length > 0 ? <div>الألوان: {p.colors.join('، ')}</div> : null}
            {p.description ? <div style={{ opacity: 0.9 }}>{p.description}</div> : null}
            <div style={{ marginTop: 4, fontWeight: 700, color: mine ? theme.gold : STATUS_COLOR[m.status] || theme.ink }}>
              {STATUS_AR[m.status] || ''}
              {m.status === 'approved' && p.product_no ? ` · رقم المنتج ${p.product_no}` : ''}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{m.body}</div>
        )}

        {(m.images ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {m.images.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer">
                <img src={u} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10 }} />
              </a>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
