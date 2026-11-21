import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminauth';
import { loadCash, loadDues, COMMISSION_RATE } from '@/lib/finance';
import { money } from '@/lib/i18n';
import { ago, dateAr } from '@/lib/contact';
import { Card } from '@/components/analyticsparts';
import { HandoverForm, PayoutForm, DeleteRecord } from '@/components/settleforms';

export const dynamic = 'force-dynamic';

const jd = (v) => money('ar', v);
const box = { border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 14, background: '#fff' };
const line = (i) => ({ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid #f1f1f1', fontSize: 13 });

export default async function SettlementsPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const tab = (Array.isArray(sp?.tab) ? sp.tab[0] : sp?.tab) === 'stores' ? 'stores' : 'cash';

  const couriers = tab === 'cash' ? await loadCash() : [];
  const stores = tab === 'stores' ? await loadDues() : [];

  const tabStyle = (active) => ({
    flex: 1,
    textAlign: 'center',
    padding: 10,
    borderRadius: 999,
    textDecoration: 'none',
    fontWeight: 600,
    border: '1px solid #111',
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#111',
  });

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>التسويات</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Link href="/admin/settlements?tab=cash" style={tabStyle(tab === 'cash')}>
          النقد (المناديب)
        </Link>
        <Link href="/admin/settlements?tab=stores" style={tabStyle(tab === 'stores')}>
          مستحقات المحلات
        </Link>
      </div>

      {tab === 'cash' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <Card label="بذمّة المناديب" value={jd(couriers.reduce((s, c) => s + c.balance, 0))} />
            <Card label="محصّل اليوم" value={jd(couriers.reduce((s, c) => s + c.todayCollected, 0))} />
            <Card label="مستلم اليوم" value={jd(couriers.reduce((s, c) => s + c.todayHanded, 0))} />
          </div>

          {couriers.length === 0 && <p style={{ color: '#777' }}>ما في مناديب.</p>}

          {couriers.map((c) => (
            <div key={c.id} style={box}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b>{c.name}</b>
                <b style={{ color: c.balance > 0.009 ? '#b00' : '#177a3c' }}>الرصيد: {jd(c.balance)}</b>
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 6, lineHeight: 1.8 }}>
                محصّل اليوم {jd(c.todayCollected)} · مستلم اليوم {jd(c.todayHanded)}
                <br />
                إجمالي المحصّل {jd(c.collected)} · إجمالي المستلم {jd(c.handed)}
              </div>

              <HandoverForm courierId={c.id} balance={c.balance} />

              {c.handovers.length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>آخر التسليمات ({c.handovers.length})</summary>
                  {c.handovers.map((h, i) => (
                    <div key={h.id} style={line(i)}>
                      <span>
                        {jd(h.amount)} · {h.at ? ago(h.at) : ''}
                        {h.note ? ` · ${h.note}` : ''}
                      </span>
                      <DeleteRecord kind="handover" id={h.id} />
                    </div>
                  ))}
                </details>
              )}

              {c.deliveries.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>آخر التوصيلات ({c.deliveries.length})</summary>
                  {c.deliveries.map((d, i) => (
                    <div key={d.id} style={line(i)}>
                      <Link href={`/admin/orders/${d.id}`} style={{ color: '#111' }}>
                        <bdi dir="ltr">#{d.no}</bdi>
                      </Link>
                      <span>
                        {jd(d.amount)} · {d.at ? dateAr(d.at) : ''}
                      </span>
                    </div>
                  ))}
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'stores' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 6 }}>
            <Card label="مبيعات موصّلة" value={jd(stores.reduce((s, x) => s + x.sales, 0))} />
            <Card label="مدفوع للمحلات" value={jd(stores.reduce((s, x) => s + x.paid, 0))} />
            <Card label="مستحق للمحلات" value={jd(stores.reduce((s, x) => s + x.balance, 0))} />
          </div>
          <p style={{ fontSize: 12, color: '#777', margin: '0 0 14px' }}>
            العمولة {Math.round(COMMISSION_RATE * 100)}% من مبيعات المنتجات الموصّلة. رسوم التوصيل إلك.
          </p>

          {stores.map((s) => (
            <div key={s.id} style={box}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b>{s.name}</b>
                <b style={{ color: s.balance > 0.009 ? '#b00' : '#177a3c' }}>المتبقي: {jd(s.balance)}</b>
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 6, lineHeight: 1.8 }}>
                مبيعات {jd(s.sales)} ({s.count} طرد) · عمولة {jd(s.commission)}
                <br />
                الصافي {jd(s.net)} · المدفوع {jd(s.paid)}
              </div>

              <PayoutForm storeId={s.id} balance={s.balance} />

              {s.payouts.length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>آخر الدفعات ({s.payouts.length})</summary>
                  {s.payouts.map((p, i) => (
                    <div key={p.id} style={line(i)}>
                      <span>
                        {jd(p.amount)} · {p.at ? dateAr(p.at) : ''}
                        {p.method ? ` · ${p.method}` : ''}
                        {p.note ? ` · ${p.note}` : ''}
                      </span>
                      <DeleteRecord kind="payout" id={p.id} />
                    </div>
                  ))}
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
