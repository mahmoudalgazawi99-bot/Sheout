import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStoreSession } from '@/lib/storeauth';
import { loadScorecards, MIN_PARCELS, WEIGHTS } from '@/lib/scorecard';
import { ACCEPT_MINUTES, PREP_MINUTES } from '@/lib/agreement';
import { StatCard, chipStyle, boxStyle } from '@/components/storeparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const RANGES = [
  ['7', '7 أيام'],
  ['30', '30 يوم'],
  ['all', 'الكل'],
];

const isNum = (v) => v !== null && v !== undefined && !Number.isNaN(v);
const m = (v) => (isNum(v) ? `${Math.round(v)} د` : '—');
const p = (v) => (isNum(v) ? `${Math.round(v * 100)}%` : '—');
const star = (v) => (isNum(v) ? `${v.toFixed(1)} ★` : '—');

export default async function StorePerformancePage({ searchParams }) {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const sp = await searchParams;
  const rawRange = Array.isArray(sp?.range) ? sp.range[0] : sp?.range;
  const range = RANGES.some(([k]) => k === rawRange) ? rawRange : '30';
  const days = range === '7' ? 7 : range === 'all' ? null : 30;

  const { rows, avg, scoredCount } = await loadScorecards(days);
  const me = rows.find((r) => r.id === account.store_id);
  const vs = (txt) => (avg ? `متوسط المنصة ${txt}` : '');

  const scoreColor = me && me.score !== null ? (me.score >= 80 ? '#177a3c' : me.score >= 60 ? theme.gold : '#b00') : theme.muted;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/store" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>بطاقة الأداء</h1>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {RANGES.map(([k, label]) => (
          <Link key={k} href={`/store/performance?range=${k}`} style={chipStyle(k === range)}>
            {label}
          </Link>
        ))}
      </div>

      {!me ? (
        <p style={{ color: theme.muted }}>ما في بيانات.</p>
      ) : (
        <>
          <div style={{ ...boxStyle, marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: theme.muted }}>علامة الأداء</div>
            <div style={{ fontSize: 48, fontWeight: 700, color: scoreColor, lineHeight: 1.3 }}>
              {me.score !== null ? me.score : '—'}
              {me.score !== null && <span style={{ fontSize: 18 }}> / 100</span>}
            </div>
            {me.score !== null ? (
              <div style={{ fontSize: 14 }}>
                الترتيب <b>{me.rank}</b> من {scoredCount} محلات
              </div>
            ) : (
              <div style={{ fontSize: 13, color: theme.muted }}>
                بيانات قليلة بهالفترة (بنحتاج {MIN_PARCELS} طرود على الأقل). عندك {me.parcels}.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 10 }}>
            <StatCard label="متوسط وقت القبول" value={m(me.acceptMins)} sub={vs(m(avg && avg.acceptMins))} />
            <StatCard
              label={`قبول خلال ${ACCEPT_MINUTES} د`}
              value={p(me.acceptRate)}
              sub={vs(p(avg && avg.acceptRate))}
            />
            <StatCard label="متوسط وقت التجهيز" value={m(me.prepMins)} sub={vs(m(avg && avg.prepMins))} />
            <StatCard
              label={`تجهيز خلال ${PREP_MINUTES} د`}
              value={p(me.prepRate)}
              sub={vs(p(avg && avg.prepRate))}
            />
            <StatCard label="نسبة البلاغات" value={p(me.issueRate)} sub={`${me.issues} بلاغ · ${vs(p(avg && avg.issueRate))}`} />
            <StatCard label="تقييم منتجاتك" value={star(me.rating)} sub={`${me.ratingCount} تقييم`} />
            <StatCard label="شكاوى الزبائن" value={me.complaints} />
            <StatCard label="طرود ملغية" value={me.cancelled} sub={`من ${me.parcels + me.cancelled}`} />
          </div>

          <div style={{ fontSize: 12, color: theme.muted, marginTop: 12, lineHeight: 1.9 }}>
            العلامة = القبول بالوقت ({WEIGHTS.accept}) + التجهيز بالوقت ({WEIGHTS.prep}) + قلة البلاغات ({WEIGHTS.issues}) +
            تقييم المنتجات ({WEIGHTS.rating}) + قلة الشكاوى ({WEIGHTS.complaints}). والمقارنة مع المحلات الأخرى بدون ذكر
            أسمائها.
          </div>
        </>
      )}
    </main>
  );
}
