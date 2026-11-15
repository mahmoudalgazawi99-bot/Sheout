import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession, canPickup } from '@/lib/courierauth';
import { loadPickup } from '@/lib/courierdata';
import { PickupButton } from '@/components/courierorderactions';
import { Contact, Items, box, parcelOrderNo } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const partText = (s) => (s.parts_total > 1 ? `طرد ${s.part_no} من ${s.parts_total}` : '');

export default async function CourierPickupPage() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');
  if (!canPickup(account.role)) redirect('/courier');

  const { stores, carrying } = await loadPickup(account.id);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>للاستلام من المحلات</h1>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
        استلم الطرد من المحل وسلّمه للمستودع. بيانات الزبون ما بتظهر لك هون.
      </div>

      {carrying.length > 0 && (
        <div>
          <h2 style={{ fontFamily: theme.serif, fontSize: 20, margin: '18px 0 10px' }}>
            معك للمستودع ({carrying.length})
          </h2>
          {carrying.map((s) => {
            const st = s.stores || {};
            return (
              <div key={s.id} style={{ ...box, borderColor: theme.ink }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <b>
                    طلب{' '}
                    <bdi dir="ltr" style={{ color: theme.gold }}>
                      {parcelOrderNo(s)}
                    </bdi>
                  </b>
                  <span style={{ fontSize: 12, color: theme.muted }}>{partText(s)}</span>
                </div>
                <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>من {st.name_ar || st.name}</div>
                <Items items={s.order_items} />
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 8 }}>سلّمه لموظف المستودع.</div>
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ fontFamily: theme.serif, fontSize: 20, margin: '18px 0 10px' }}>جاهزة للاستلام</h2>
      {stores.length === 0 && <p style={{ color: theme.muted }}>ما في طرود جاهزة حالياً.</p>}

      {stores.map((g) => {
        const st = g.store || {};
        const loc = st.location_ar || st.location || '';
        const ids = g.parcels.map((p) => p.id);
        return (
          <div key={st.id || 'unknown'} style={box}>
            <b style={{ fontSize: 16 }}>{st.name_ar || st.name}</b>
            {loc ? <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>{loc}</div> : null}
            <Contact phone={st.phone} mapQuery={[st.name, st.location].filter(Boolean).join(' ')} mapLabel="موقع المحل" />

            {g.parcels.map((s) => (
              <div key={s.id} style={{ borderTop: `1px solid ${theme.line}`, marginTop: 12, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <b>
                    طلب{' '}
                    <bdi dir="ltr" style={{ color: theme.gold }}>
                      {parcelOrderNo(s)}
                    </bdi>
                  </b>
                  <span style={{ fontSize: 12, color: theme.muted }}>{partText(s)}</span>
                </div>
                <Items items={s.order_items} />
                <PickupButton ids={[s.id]} />
              </div>
            ))}

            {g.parcels.length > 1 && (
              <div style={{ borderTop: `2px solid ${theme.ink}`, marginTop: 14, paddingTop: 4 }}>
                <PickupButton ids={ids} label={`استلمت كل طرود هذا المحل (${ids.length})`} />
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
