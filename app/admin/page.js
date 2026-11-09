import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import AdminLogout from '@/components/adminlogout';
import PushSetup from '@/components/pushsetup';

export const dynamic = 'force-dynamic';

const money = (v) => `${Number(v).toFixed(2)} JD`;
const when = (v) => String(v).replace('T', ' ').slice(0, 16);

const linkBtn = {
  display: 'inline-block',
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#111',
  textDecoration: 'none',
  background: '#fff',
};

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, total, status, created_at, customers(name, phone, member_no), sub_orders(id)')
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: readyCount } = await supabaseAdmin
    .from('sub_orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ready');

  let issueCount = 0;
  try {
    const { count } = await supabaseAdmin
      .from('order_issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open');
    issueCount = count || 0;
  } catch {}

  const orders = data ?? [];

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <AdminLogout />
      </div>

      <div style={{ margin: '12px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link
          href="/admin/courier"
          style={{ ...linkBtn, background: '#111', color: '#fff', border: '1px solid #111' }}
        >
          Courier · {readyCount || 0} ready{issueCount > 0 ? ` · ${issueCount} issues` : ''}
        </Link>
        <Link href="/admin/analytics" style={linkBtn}>
          Analytics
        </Link>
        <Link href="/admin/stores" style={linkBtn}>
          Store accounts
        </Link>
      </div>

      <div dir="rtl">
        <PushSetup
          publicKey={process.env.VAPID_PUBLIC_KEY || ''}
          apiBase="/api/admin/push"
          swUrl="/store-sw.js"
          scope="/admin"
        />
      </div>

      <p style={{ color: '#777', fontSize: 13 }}>{orders.length} latest orders</p>

      {orders.length === 0 && <p style={{ color: '#777' }}>No orders yet.</p>}

      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/admin/orders/${o.id}`}
          style={{ display: 'block', border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 10, textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <b>#{o.order_no || String(o.id).slice(0, 8).toUpperCase()}</b>
            <b>{money(o.total)}</b>
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {o.customers?.name} · {o.customers?.phone}
            {o.customers?.member_no ? ` · member ${o.customers.member_no}` : ''}
          </div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
            {when(o.created_at)} · {(o.sub_orders ?? []).length} store(s) · status: <b>{o.status}</b>
          </div>
        </Link>
      ))}
    </main>
  );
}
