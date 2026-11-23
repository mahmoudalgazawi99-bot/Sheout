import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession, canPickup } from '@/lib/courierauth';
import { loadMyCash } from '@/lib/couriercash';
import { jd, box } from '@/components/courierparts';
import { ago } from '@/lib/contact';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function CourierCashPage() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');
  if (!canPickup(account.role)) redirect('/warehouse');

  const c = await loadMyCash(account.id);
  const owes = c.balance > 0.009;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>رصيدي النقدي</h1>

      <div style={{ ...box, background: owes ? theme.ink : theme.card, color: owes ? theme.gold : theme.ink }}>
        <div style={{ fontSize: 13 }}>بذمّتك للإدارة الآن</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{jd(c.balance)}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {owes ? 'سلّم المبلغ للإدارة، وهي بتسجّل التسليم.' : 'ما عليك شي. شكراً!'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ ...box, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: theme.muted }}>حصّلت اليوم</div>
          <b style={{ fontSize: 18 }}>{jd(c.todayCollected)}</b>
        </div>
        <div style={{ ...box, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: theme.muted }}>سلّمت اليوم</div>
          <b style={{ fontSize: 18 }}>{jd(c.todayHanded)}</b>
        </div>
      </div>

      <h2 style={{ fontFamily: theme.serif, fontSize: 18, margin: '18px 0 8px' }}>توصيلات اليوم ({c.todayDeliveries.length})</h2>
      <div style={box}>
        {c.todayDeliveries.length === 0 && <div style={{ color: theme.muted, fontSize: 14 }}>ما في توصيلات اليوم.</div>}
        {c.todayDeliveries.map((d, i) => (
          <div
            key={d.id}
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
              #{d.no}
            </bdi>
            <b>{jd(d.amount)}</b>
          </div>
        ))}
      </div>

      {c.handovers.length > 0 && (
        <details style={{ marginTop: 6 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>آخر تسليماتي ({c.handovers.length})</summary>
          <div style={{ ...box, marginTop: 8 }}>
            {c.handovers.map((h, i) => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                  fontSize: 14,
                }}
              >
                <span>{h.at ? ago(h.at) : ''}</span>
                <b>{jd(h.amount)}</b>
              </div>
            ))}
          </div>
        </details>
      )}
    </main>
  );
}
