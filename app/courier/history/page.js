import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession } from '@/lib/courierauth';
import { loadCourierHistory } from '@/lib/courierdata';
import { jd, box } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

function Row({ r, i }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        padding: '9px 0',
        borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
        fontSize: 14,
      }}
    >
      <span>
        <bdi dir="ltr" style={{ color: theme.gold }}>
          #{r.orderNo}
        </bdi>
        {r.customer ? <span style={{ color: theme.muted }}> · {r.customer}</span> : null}
      </span>
      <b>{jd(r.amount)}</b>
    </div>
  );
}

export default async function CourierHistoryPage() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');

  const { todayRows, earlier, todayTotal } = await loadCourierHistory(account.id);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>سجل التوصيل</h1>

      <div style={{ ...box, background: theme.ink, color: theme.gold }}>
        <div style={{ fontSize: 13 }}>المبلغ اللي حصّلته اليوم</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{jd(todayTotal)}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{todayRows.length} طلب موصّل</div>
      </div>

      <h2 style={{ fontFamily: theme.serif, fontSize: 18, margin: '18px 0 8px' }}>اليوم</h2>
      <div style={box}>
        {todayRows.length === 0 && <div style={{ color: theme.muted, fontSize: 14 }}>ما وصّلت شي اليوم.</div>}
        {todayRows.map((r, i) => (
          <Row key={r.id} r={r} i={i} />
        ))}
      </div>

      {earlier.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>قبل اليوم ({earlier.length})</summary>
          <div style={{ ...box, marginTop: 8 }}>
            {earlier.map((r, i) => (
              <Row key={r.id} r={r} i={i} />
            ))}
          </div>
        </details>
      )}
    </main>
  );
}
