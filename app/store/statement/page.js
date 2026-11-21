import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStoreSession } from '@/lib/storeauth';
import { loadDues, COMMISSION_RATE } from '@/lib/finance';
import { dateAr } from '@/lib/contact';
import { StatCard, boxStyle, money } from '@/components/storeparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function StoreStatementPage() {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const all = await loadDues();
  const s = all.find((x) => x.id === account.store_id);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/store" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>كشف الحساب</h1>

      {!s ? (
        <p style={{ color: theme.muted }}>ما في بيانات.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <StatCard label="مبيعات موصّلة" value={money(s.sales)} sub={`${s.count} طرد`} />
            <StatCard label={`العمولة (${Math.round(COMMISSION_RATE * 100)}%)`} value={money(s.commission)} />
            <StatCard label="الصافي لك" value={money(s.net)} />
            <StatCard label="المدفوع لك" value={money(s.paid)} />
          </div>
          <div style={{ marginTop: 10 }}>
            <StatCard label="المتبقي لك" value={money(s.balance)} highlight={s.balance > 0.009} />
          </div>

          <div style={{ ...boxStyle, marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>آخر الدفعات</div>
            {s.payouts.length === 0 && <div style={{ color: theme.muted, fontSize: 14 }}>ما في دفعات لسا.</div>}
            {s.payouts.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                  fontSize: 14,
                }}
              >
                <span>
                  {p.at ? dateAr(p.at) : ''}
                  {p.method ? ` · ${p.method}` : ''}
                </span>
                <b>{money(p.amount)}</b>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: theme.muted, marginTop: 10, lineHeight: 1.7 }}>
            المبيعات بتحسب للطرود اللي انوصّلت للزبون بس. أي استفسار، راسل الإدارة من المحادثة.
          </div>
        </>
      )}
    </main>
  );
}
