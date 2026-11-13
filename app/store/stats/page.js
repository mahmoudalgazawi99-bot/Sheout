import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import AutoRefresh from '@/components/autorefresh';
import { computeStoreStats } from '@/lib/storestats';
import { computeStoreSpeed } from '@/lib/storespeed';
import { StatCard, chipStyle, boxStyle, money } from '@/components/storeparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const RANGES = [
  ['today', 'اليوم'],
  ['7', '7 أيام'],
  ['30', '30 يوم'],
  ['all', 'الكل'],
];

const durAr = (m) => {
  if (m === null || m === undefined) return '—';
  const t = Math.round(m);
  if (t < 60) return `${t} دقيقة`;
  return `${Math.floor(t / 60)} س ${t % 60} د`;
};

export default async function StoreStatsPage({ searchParams }) {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const sp = await searchParams;
  const rawRange = Array.isArray(sp?.range) ? sp.range[0] : sp?.range;
  const range = RANGES.some(([k]) => k === rawRange) ? rawRange : 'today';

  const { data } = await supabaseAdmin
    .from('sub_orders')
    .select('status, subtotal, created_at, confirmed_at, ready_at, order_items(quantity, price, products(name, name_ar))')
    .eq('store_id', account.store_id)
    .order('created_at', { ascending: false })
    .limit(1000);

  const stats = computeStoreStats(data ?? [], range);
  const speed = computeStoreSpeed(data ?? [], range);
  const maxQty = stats.top[0] ? stats.top[0].qty : 1;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <Link href="/store" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>الإحصائيات</h1>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {RANGES.map(([k, label]) => (
          <Link key={k} href={`/store/stats?range=${k}`} style={chipStyle(k === range)}>
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 12 }}>
        <StatCard label="عدد الطلبات" value={stats.orders} />
        <StatCard label="مجموع قيمة الطلبات" value={money(stats.amount)} />
        <StatCard label="القطع المباعة" value={stats.pieces} />
        <StatCard
          label="الأكثر طلباً"
          value={stats.top[0] ? stats.top[0].name : '—'}
          sub={stats.top[0] ? `${stats.top[0].qty} قطعة` : ''}
          valueSize={16}
        />
        <StatCard label="متوسط وقت القبول" value={durAr(speed.accept)} valueSize={16} />
        <StatCard label="متوسط وقت التجهيز" value={durAr(speed.prep)} valueSize={16} />
      </div>

      {stats.top.length > 1 && (
        <div style={{ ...boxStyle, marginTop: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>أكثر المنتجات طلباً</div>
          {stats.top.map((p, i) => (
            <div key={p.name} style={{ marginBottom: i === stats.top.length - 1 ? 0 : 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>
                  {i + 1}. {p.name}
                </span>
                <b>{p.qty} قطعة</b>
              </div>
              <div style={{ height: 6, background: theme.goldSoft, borderRadius: 3, marginTop: 4 }}>
                <div
                  style={{
                    width: `${(p.qty / maxQty) * 100}%`,
                    height: '100%',
                    background: theme.gold,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, color: theme.muted, marginTop: 8, lineHeight: 1.7 }}>
        الإحصائيات بتستثني الطلبات الملغية. وقت القبول والتجهيز بيُحسب للطلبات اللي تغيّرت حالتها بعد تفعيل هالميزة.
      </div>
    </main>
  );
}
