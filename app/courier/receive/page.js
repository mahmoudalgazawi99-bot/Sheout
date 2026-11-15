import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession, canWarehouse } from '@/lib/courierauth';
import { loadWarehouse } from '@/lib/courierdata';
import { ReceiveButton } from '@/components/courierorderactions';
import { Items, box, orderNoOf } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const STATUS_AR = { new: 'لسا عند المحل', confirmed: 'لسا عند المحل', ready: 'جاهز عند المحل' };

export default async function WarehouseReceivePage() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');
  if (!canWarehouse(account.role)) redirect('/courier');

  const { incoming } = await loadWarehouse();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>استلام بالمستودع</h1>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
        لما المندوب يسلّمك طرد، تأكد من رقم الطلب والقطع، واضغط "استلمت".
      </div>

      {incoming.length === 0 && <p style={{ color: theme.muted }}>ما في طرود بالطريق للمستودع حالياً.</p>}

      {incoming.map(({ o, active, received }) => (
        <div key={o.id} style={box}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>
              طلب{' '}
              <bdi dir="ltr" style={{ color: theme.gold }}>
                {orderNoOf(o)}
              </bdi>
            </b>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              وصل {received} من {active.length}
            </span>
          </div>

          {active.map((s) => {
            const st = s.stores || {};
            const atWh = s.status === 'picked_up' && s.at_warehouse_at;
            const arriving = s.status === 'picked_up' && !s.at_warehouse_at;
            return (
              <div key={s.id} style={{ borderTop: `1px solid ${theme.line}`, marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <b style={{ fontSize: 14 }}>
                    {s.parts_total > 1 ? `طرد ${s.part_no} من ${s.parts_total} · ` : ''}
                    {st.name_ar || st.name}
                  </b>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: atWh ? '#177a3c' : arriving ? theme.gold : theme.muted,
                    }}
                  >
                    {atWh ? 'وصل المستودع ✓' : arriving ? 'مع المندوب' : STATUS_AR[s.status] || s.status}
                  </span>
                </div>
                <Items items={s.order_items} />
                {arriving && <ReceiveButton subOrderId={s.id} />}
              </div>
            );
          })}
        </div>
      ))}
    </main>
  );
}
