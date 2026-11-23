import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminauth';
import { loadScorecards, MIN_PARCELS } from '@/lib/scorecard';
import { AGREEMENT_VERSION } from '@/lib/agreement';
import { dateAr } from '@/lib/contact';

export const dynamic = 'force-dynamic';

const RANGES = [
  ['7', '7 أيام'],
  ['30', '30 يوم'],
  ['all', 'الكل'],
];

const isNum = (v) => v !== null && v !== undefined && !Number.isNaN(v);
const m = (v) => (isNum(v) ? `${Math.round(v)} د` : '—');
const p = (v) => (isNum(v) ? `${Math.round(v * 100)}%` : '—');

export default async function ScorecardsPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const rawRange = Array.isArray(sp?.range) ? sp.range[0] : sp?.range;
  const range = RANGES.some(([k]) => k === rawRange) ? rawRange : '30';
  const days = range === '7' ? 7 : range === 'all' ? null : 30;

  const { rows, avg } = await loadScorecards(days);
  const notAgreed = rows.filter((r) => !r.agreedAt).length;

  const chip = (active) => ({
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    border: `1px solid ${active ? '#111' : '#ddd'}`,
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#111',
  });

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>بطاقات أداء المحلات</h1>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
        {RANGES.map(([k, label]) => (
          <Link key={k} href={`/admin/scorecards?range=${k}`} style={chip(k === range)}>
            {label}
          </Link>
        ))}
      </div>

      <div style={{ fontSize: 13, color: '#555', margin: '10px 0 14px', lineHeight: 1.8 }}>
        الاتفاقية (إصدار {AGREEMENT_VERSION}):{' '}
        {notAgreed === 0 ? (
          <b style={{ color: '#177a3c' }}>كل المحلات وافقت</b>
        ) : (
          <b style={{ color: '#b00' }}>{notAgreed} محل لسا ما وافق</b>
        )}
        {avg && isNum(avg.score) ? ` · متوسط العلامة ${Math.round(avg.score)}` : ''}
        <br />
        العلامة بتظهر بعد {MIN_PARCELS} طرود على الأقل بالفترة.
      </div>

      {rows.map((r) => (
        <div key={r.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <b>
              {r.rank ? `${r.rank}. ` : ''}
              {r.name}
            </b>
            <b
              style={{
                fontSize: 20,
                color: r.score === null ? '#999' : r.score >= 80 ? '#177a3c' : r.score >= 60 ? '#b8924a' : '#b00',
              }}
            >
              {r.score === null ? '—' : r.score}
            </b>
          </div>

          <div style={{ fontSize: 12, marginTop: 4, color: r.agreedAt ? '#177a3c' : '#b00' }}>
            {r.agreedAt ? `✓ وافق على الاتفاقية ${dateAr(r.agreedAt)}` : '✗ ما وافق على الاتفاقية'}
          </div>

          <div style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.9 }}>
            {r.parcels} طرد ({r.cancelled} ملغي)
            <br />
            قبول: متوسط {m(r.acceptMins)} · بالوقت {p(r.acceptRate)}
            <br />
            تجهيز: متوسط {m(r.prepMins)} · بالوقت {p(r.prepRate)}
            <br />
            بلاغات {r.issues} ({p(r.issueRate)}) · شكاوى {r.complaints} · تقييم{' '}
            {isNum(r.rating) ? `${r.rating.toFixed(1)} ★ (${r.ratingCount})` : '—'}
          </div>
        </div>
      ))}

      <p style={{ fontSize: 12, color: '#777', lineHeight: 1.8 }}>
        الغرامات (حسب الاتفاقية) بتطبّقها إنت يدوياً بناءً على هالأرقام، وما بتنخصم تلقائياً.
      </p>
    </main>
  );
}
