import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { dayKey, toDate } from '@/lib/analytics';
import { money } from '@/lib/i18n';
import AutoRefresh from '@/components/autorefresh';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const VIEWS = [
  ['active', 'قيد التنفيذ'],
  ['today', 'اليوم'],
  ['done', 'المنتهية'],
  ['all', 'الكل'],
];

const STATUS_AR = { new: 'جديد', processing: 'قيد التنفيذ', delivered: 'تم التوصيل', cancelled: 'ملغي' };
const STATUS_COLOR = { new: '#b86a00', processing: '#2f5d50', delivered: '#177a3c', cancelled: '#b00' };

function fmt(v) {
  const d = toDate(v);
  if (!d) return '';
  return d.toLocaleString('ar-JO', { timeZone: 'Asia/Amman', dateStyle: 'short', timeStyle: 'short' });
}

export default async function AdminOrdersPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const rawView = Array.isArray(sp?.view) ? sp.view[0] : sp?.view;
  const view = VIEWS.some(([k]) => k === rawView) ? rawView : 'active';
  const rawQ = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const q = String(rawQ || '').replace(/[%_\\,()]/g, '').trim().slice(0, 40);

  let query = supabaseAdmin
    .from('orders')
    .select('id, order_no, total, status, created_at, customers(name, phone, member_no), sub_orders(id)')
    .order('created_at', { ascending: false })
    .limit(60);

  if (view === 'active') query = query.not('status', 'in', '(delivered,cancelled)');
  else if (view === 'today') {
    const start = new Date(`${dayKey(new Date())}T00:00:00+03:00`).toISOString();
    query = query.gte('created_at', start);
  } else if (view === 'done') query = query.in('status', ['delivered', 'cancelled']);
  if (q) query = query.ilike('order_no', `%${q}%`);

  const { data } = await query;
  const orders = data ?? [];

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <Link href="/admin" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, margin: '10px 0' }}>الطلبات</h1>

      <form method="GET" style={{ display: 'flex', gap: 8 }}>
        <input type="hidden" name="view" value={view} />
        <input
          name="q"
          defaultValue={q}
          dir="ltr"
          placeholder="رقم الطلب (مثل 20261109)"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 999,
            border: `1px solid ${theme.line}`,
            background: theme.card,
            fontSize: 15,
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: theme.ink,
            color: theme.gold,
            fontWeight: 600,
          }}
        >
          بحث
        </button>
      </form>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
        {VIEWS.map(([k, label]) => (
          <Link
            key={k}
            href={`/admin/orders?view=${k}`}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 13,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              border: `1px solid ${k === view ? theme.ink : theme.line}`,
              background: k === view ? theme.ink : theme.card,
              color: k === view ? theme.gold : theme.ink,
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {orders.length === 0 && <p style={{ color: theme.muted }}>ما في طلبات هون.</p>}

      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/admin/orders/${o.id}`}
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            background: theme.card,
            border: `1px solid ${theme.line}`,
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
            padding: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>
              <bdi dir="ltr">#{o.order_no || String(o.id).slice(0, 8).toUpperCase()}</bdi>
            </b>
            <b>{money('ar', o.total)}</b>
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {o.customers ? o.customers.name : ''} · <bdi dir="ltr">{o.customers ? o.customers.phone : ''}</bdi>
          </div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
            {fmt(o.created_at)} · {(o.sub_orders ?? []).length} محل ·{' '}
            <b style={{ color: STATUS_COLOR[o.status] || theme.ink }}>{STATUS_AR[o.status] || o.status}</b>
          </div>
        </Link>
      ))}
    </main>
  );
}
