import { PickupButton, DeliverButton } from '@/components/courierorderactions';
import { toDate, normPhone } from '@/lib/analytics';
import { sizeLabel, colorLabel, money } from '@/lib/i18n';
import { theme } from '@/lib/theme';

export const jd = (v) => money('ar', v);

const STATUS_AR = {
  new: 'المحل لسا ما قبل الطلب',
  confirmed: 'قيد التجهيز عند المحل',
  ready: 'جاهز للاستلام',
  picked_up: 'تم الاستلام ✓',
  delivered: 'موصّل ✓',
};

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

function Contact({ phone, mapQuery, mapLabel }) {
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

export function OrderCard({ e }) {
  const { o, subs, collect, mine, allPicked } = e;
  const orderNo = o.order_no || String(o.id).slice(0, 8).toUpperCase();

  return (
    <div style={box}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <b>
          طلب{' '}
          <bdi dir="ltr" style={{ color: theme.gold }}>
            {orderNo}
          </bdi>
        </b>
        <span style={{ fontSize: 12, color: theme.muted }}>{ago(o.created_at)}</span>
      </div>

      {subs.map((s) => {
        const st = s.stores || {};
        const loc = st.location_ar || st.location || '';
        const done = s.status === 'picked_up' || s.status === 'delivered';
        return (
          <div key={s.id} style={{ borderTop: `1px solid ${theme.line}`, marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <b>
                {s.parts_total > 1 ? `طرد ${s.part_no} من ${s.parts_total} · ` : ''}
                {st.name_ar || st.name}
              </b>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: done ? '#177a3c' : s.status === 'ready' ? theme.gold : theme.muted,
                }}
              >
                {STATUS_AR[s.status] || s.status}
              </span>
            </div>
            {loc ? <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>{loc}</div> : null}

            {(s.order_items ?? []).map((it, idx) => {
              const p = it.products;
              const name = p ? p.name_ar || p.name : '';
              const d = [it.size ? sizeLabel('ar', it.size) : '', it.color ? colorLabel('ar', it.color) : '']
                .filter(Boolean)
                .join(' / ');
              return (
                <div key={idx} style={{ fontSize: 14, marginTop: 6 }}>
                  {name} × {it.quantity}
                  {p && p.product_no ? (
                    <span style={{ color: theme.muted, fontSize: 12 }}> · رقم {p.product_no}</span>
                  ) : null}
                  {d ? <span style={{ color: theme.muted, fontSize: 13 }}> ({d})</span> : null}
                </div>
              );
            })}

            <Contact
              phone={st.phone}
              mapQuery={[st.name, st.location].filter(Boolean).join(' ')}
              mapLabel="موقع المحل"
            />

            {s.status === 'ready' && <PickupButton subOrderId={s.id} />}
          </div>
        );
      })}

      {mine ? (
        <div style={{ borderTop: `2px solid ${theme.ink}`, marginTop: 14, paddingTop: 12 }}>
          <div style={{ fontWeight: 700 }}>معلومات التوصيل</div>
          <div style={{ fontSize: 14, lineHeight: 1.9, marginTop: 6 }}>
            <div>
              الزبون: <b>{o.customers ? o.customers.name : ''}</b>
            </div>
            <div>
              الهاتف: <bdi dir="ltr">{o.customers ? o.customers.phone : ''}</bdi>
            </div>
            <div>العنوان: {o.address}</div>
            {o.notes ? <div>ملاحظات: {o.notes}</div> : null}
          </div>
          <Contact phone={o.customers ? o.customers.phone : ''} mapQuery={o.address} mapLabel="موقع الزبون" />

          <div style={{ marginTop: 12, padding: '10px 12px', background: theme.goldSoft, borderRadius: 10 }}>
            المبلغ المطلوب تحصيله: <b style={{ fontSize: 18 }}>{jd(collect)}</b>
          </div>

          {allPicked ? (
            <DeliverButton orderId={o.id} amount={jd(collect)} />
          ) : (
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 10 }}>
              زر التوصيل بيظهر لما تستلم كل الطرود.
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 12 }}>
          بيانات الزبون بتظهر بعد ما تستلم أول طرد وبيصير الطلب إلك.
        </div>
      )}
    </div>
  );
}
