import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession, canWarehouse } from '@/lib/courierauth';
import { loadWarehouse } from '@/lib/courierdata';
import { PackButton } from '@/components/courierorderactions';
import { Items, box, orderNoOf, ago } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function WarehousePackPage() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');
  if (!canWarehouse(account.role)) redirect('/courier');

  const { toPack, packed } = await loadWarehouse();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>تجهيز الطلبات</h1>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
        طلبات وصلت كل طرودها. جمّع القطع بطرد وحد، واكتب رقم الطلب عليه.
      </div>

      <h2 style={{ fontFamily: theme.serif, fontSize: 20, margin: '18px 0 10px' }}>جاهزة للتجهيز ({toPack.length})</h2>
      {toPack.length === 0 && <p style={{ color: theme.muted }}>ما في طلبات جاهزة للتجهيز.</p>}

      {toPack.map(({ o, active }) => (
        <div key={o.id} style={{ ...box, borderColor: theme.ink }}>
          <b>
            طلب{' '}
            <bdi dir="ltr" style={{ color: theme.gold }}>
              {orderNoOf(o)}
            </bdi>
          </b>
          {active.map((s) => {
            const st = s.stores || {};
            return (
              <div key={s.id} style={{ borderTop: `1px solid ${theme.line}`, marginTop: 10, paddingTop: 8 }}>
                <div style={{ fontSize: 13, color: theme.muted }}>
                  {s.parts_total > 1 ? `طرد ${s.part_no} من ${s.parts_total} · ` : ''}
                  {st.name_ar || st.name}
                </div>
                <Items items={s.order_items} />
              </div>
            );
          })}
          <PackButton orderId={o.id} />
        </div>
      ))}

      {packed.length > 0 && (
        <div>
          <h2 style={{ fontFamily: theme.serif, fontSize: 20, margin: '22px 0 10px' }}>مجهّزة ({packed.length})</h2>
          <div style={box}>
            {packed.map(({ o }, i) => (
              <div
                key={o.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                  fontSize: 14,
                }}
              >
                <bdi dir="ltr" style={{ color: theme.gold }}>
                  #{orderNoOf(o)}
                </bdi>
                <span style={{ color: o.courier_id ? '#177a3c' : theme.muted }}>
                  {o.courier_id ? 'خرج للتوصيل' : `بانتظار مندوب · جُهّز ${ago(o.packed_at)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
