import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession, canPickup } from '@/lib/courierauth';
import { loadDelivery } from '@/lib/courierdata';
import { TakeButton, DeliverButton } from '@/components/courierorderactions';
import { Contact, Items, box, jd, orderNoOf, ago } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function CourierDeliverPage() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');
  if (!canPickup(account.role)) redirect('/courier');

  const { available, mine } = await loadDelivery(account.id);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>التوصيل للزبائن</h1>

      <h2 style={{ fontFamily: theme.serif, fontSize: 20, margin: '18px 0 10px' }}>معك للتوصيل ({mine.length})</h2>
      {mine.length === 0 && <p style={{ color: theme.muted }}>ما معك طلبات للتوصيل.</p>}
      {mine.map(({ o, subs, collect }) => (
        <div key={o.id} style={{ ...box, borderColor: theme.ink }}>
          <b>
            طلب{' '}
            <bdi dir="ltr" style={{ color: theme.gold }}>
              {orderNoOf(o)}
            </bdi>
          </b>

          <div style={{ fontSize: 14, lineHeight: 1.9, marginTop: 8 }}>
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

          <div style={{ marginTop: 10, borderTop: `1px solid ${theme.line}`, paddingTop: 6 }}>
            {subs.map((s) => (
              <Items key={s.id} items={s.order_items} />
            ))}
          </div>

          <div style={{ marginTop: 12, padding: '10px 12px', background: theme.goldSoft, borderRadius: 10 }}>
            المبلغ المطلوب تحصيله: <b style={{ fontSize: 18 }}>{jd(collect)}</b>
          </div>

          <DeliverButton orderId={o.id} amount={jd(collect)} />
        </div>
      ))}

      <h2 style={{ fontFamily: theme.serif, fontSize: 20, margin: '22px 0 10px' }}>
        جاهزة بالمستودع ({available.length})
      </h2>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 10 }}>
        بيانات الزبون بتظهر بعد ما تستلم الطلب من المستودع.
      </div>
      {available.length === 0 && <p style={{ color: theme.muted }}>ما في طلبات جاهزة بالمستودع حالياً.</p>}
      {available.map(({ o, subs, pieces }) => (
        <div key={o.id} style={box}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>
              طلب{' '}
              <bdi dir="ltr" style={{ color: theme.gold }}>
                {orderNoOf(o)}
              </bdi>
            </b>
            <span style={{ fontSize: 12, color: theme.muted }}>جُهّز {ago(o.packed_at)}</span>
          </div>
          <div style={{ fontSize: 14, marginTop: 6 }}>
            {pieces} قطعة · {subs.length} {subs.length === 1 ? 'طرد' : 'طرود'} بطرد وحد مغلّف
          </div>
          <TakeButton orderId={o.id} />
        </div>
      ))}
    </main>
  );
}
