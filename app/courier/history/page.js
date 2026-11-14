import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession } from '@/lib/courierauth';
import { loadCourierHistory } from '@/lib/courierdata';
import CourierNoteForm from '@/components/couriernote';
import { jd, box } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

function Row({ r, i, existing, open }) {
  return (
    <div style={{ padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.line}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}>
        <span>
          <bdi dir="ltr" style={{ color: theme.gold }}>
            #{r.orderNo}
          </bdi>
          {r.customer ? <span style={{ color: theme.muted }}> · {r.customer}</span> : null}
        </span>
        <b>{jd(r.amount)}</b>
      </div>
      <details open={open} style={{ marginTop: 6 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: existing ? '#177a3c' : theme.ink, fontWeight: 600 }}>
          {existing ? 'ملاحظتك عن الزبون ✓' : 'أضف ملاحظة عن الزبون'}
        </summary>
        <CourierNoteForm orderId={r.id} existing={existing} />
      </details>
    </div>
  );
}

export default async function CourierHistoryPage({ searchParams }) {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');

  const sp = await searchParams;
  const noteParam = String((Array.isArray(sp?.note) ? sp.note[0] : sp?.note) || '');

  const { todayRows, earlier, todayTotal } = await loadCourierHistory(account.id);

  const orderIds = [...todayRows, ...earlier].map((r) => r.id);
  const notes = {};
  if (orderIds.length > 0) {
    try {
      const { data } = await supabaseAdmin
        .from('customer_notes')
        .select('order_id, tags, note')
        .eq('author_type', 'courier')
        .eq('author_id', account.id)
        .in('order_id', orderIds);
      (data ?? []).forEach((n) => {
        notes[n.order_id] = { tags: n.tags, note: n.note };
      });
    } catch {}
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>سجل التوصيل</h1>

      {noteParam && (
        <div style={{ padding: '12px 16px', borderRadius: theme.radius, background: theme.goldSoft, fontWeight: 600, marginBottom: 12 }}>
          تم التوصيل ✓ سجّل ملاحظتك عن الزبون من الطلب الأول تحت.
        </div>
      )}

      <div style={{ ...box, background: theme.ink, color: theme.gold }}>
        <div style={{ fontSize: 13 }}>المبلغ اللي حصّلته اليوم</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{jd(todayTotal)}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>{todayRows.length} طلب موصّل</div>
      </div>

      <h2 style={{ fontFamily: theme.serif, fontSize: 18, margin: '18px 0 8px' }}>اليوم</h2>
      <div style={box}>
        {todayRows.length === 0 && <div style={{ color: theme.muted, fontSize: 14 }}>ما وصّلت شي اليوم.</div>}
        {todayRows.map((r, i) => (
          <Row key={r.id} r={r} i={i} existing={notes[r.id]} open={r.id === noteParam} />
        ))}
      </div>

      {earlier.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>قبل اليوم ({earlier.length})</summary>
          <div style={{ ...box, marginTop: 8 }}>
            {earlier.map((r, i) => (
              <Row key={r.id} r={r} i={i} existing={notes[r.id]} open={r.id === noteParam} />
            ))}
          </div>
        </details>
      )}
    </main>
  );
}
