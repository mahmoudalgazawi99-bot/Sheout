import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession, canWarehouse } from '@/lib/courierauth';
import { loadBoard } from '@/lib/warehousedata';
import { ReceiveButton } from '@/components/courierorderactions';
import { Items, box, orderNoOf } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const STATUS_AR = {
  new: 'لسا عند المحل (ما قبل الطلب)',
  confirmed: 'لسا عند المحل (قيد التجهيز)',
  ready: 'جاهز عند المحل (ما انستلم)',
};

const alertBox = {
  background: '#fff7e0',
  border: '1px solid #e2c36b',
  borderRadius: 10,
  padding: '10px 12px',
  marginTop: 10,
  fontSize: 14,
  lineHeight: 1.8,
};

export default async function WarehouseReceivePage() {
  const account = await getCourierSession();
  if (!account) redirect('/warehouse/login');
  if (!canWarehouse(account.role)) redirect('/courier');

  const { incoming } = await loadBoard();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/warehouse" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>استلام الطرود</h1>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
        لما المندوب يسلّمك طرد، تأكد من رقم الطلب والقطع، واضغط "استلمت".
      </div>

      {incoming.length === 0 && <p style={{ color: theme.muted }}>ما في طرود بالطريق للمستودع حالياً.</p>}

      {incoming.map(({ o, active, received, siblings, names }) => {
        const missing = active.filter((s) => s.status !== 'picked_up');
        const carriers = [
          ...new Set(
            active
              .filter((s) => s.status === 'picked_up' && !s.at_warehouse_at)
              .map((s) => names[s.picked_up_by])
              .filter(Boolean)
          ),
        ];
        const showAlert = missing.length > 0 || carriers.length > 1;

        return (
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

            {showAlert && (
              <div style={alertBox}>
                <b>⚠️ تنبيه: هذا الطلب مش كله جاي مع نفس المندوب</b>
                {missing.map((s) => (
                  <div key={s.id}>
                    طرد {s.part_no} من {s.parts_total} · {s.stores ? s.stores.name_ar || s.stores.name : ''} ·{' '}
                    {STATUS_AR[s.status] || s.status}
                  </div>
                ))}
                {carriers.length > 1 && <div>الطرود الواصلة مع: {carriers.join(' و ')}</div>}
              </div>
            )}

            {siblings.length > 0 && (
              <div style={alertBox}>
                🔔 نفس الزبون عنده طلب ثاني مفتوح:{' '}
                {siblings.map((x, i) => (
                  <span key={x.id}>
                    {i > 0 ? '، ' : ''}
                    <bdi dir="ltr">#{orderNoOf(x)}</bdi>
                  </span>
                ))}
              </div>
            )}

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
                      {atWh
                        ? 'وصل المستودع ✓'
                        : arriving
                          ? `مع ${names[s.picked_up_by] || 'مندوب'}`
                          : STATUS_AR[s.status] || s.status}
                    </span>
                  </div>
                  <Items items={s.order_items} />
                  {arriving && <ReceiveButton subOrderId={s.id} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </main>
  );
}
