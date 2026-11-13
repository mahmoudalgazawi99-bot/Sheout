import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import AutoRefresh from '@/components/autorefresh';
import { OrderCard, chipStyle, HISTORY_LABEL } from '@/components/storeparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const TABS = [
  ['new', 'جديدة'],
  ['confirmed', 'قيد التجهيز'],
  ['ready', 'جاهزة'],
  ['history', 'السجل'],
];

const HINTS = {
  new: 'اقبل الطلب لتأكيد توفر المنتج.',
  confirmed: 'اضغط "جاهز للاستلام" لما تخلص التجهيز.',
  ready: 'اكتب رقم الطلب على الطرد وسلّمه لمندوب المنصة.',
  history: 'آخر الطلبات المنتهية.',
};

const DONE = ['picked_up', 'delivered', 'cancelled'];

export default async function StoreOrdersPage({ searchParams }) {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const sp = await searchParams;
  const rawTab = Array.isArray(sp?.tab) ? sp.tab[0] : sp?.tab;
  const tab = TABS.some(([k]) => k === rawTab) ? rawTab : 'new';

  const { data } = await supabaseAdmin
    .from('sub_orders')
    .select(
      'id, order_id, part_no, parts_total, status, subtotal, created_at, orders(order_no), order_items(quantity, size, color, products(name, name_ar, images, product_no))'
    )
    .eq('store_id', account.store_id)
    .order('created_at', { ascending: false })
    .limit(100);

  const orders = data ?? [];
  const inTab = (k) => (k === 'history' ? orders.filter((o) => DONE.includes(o.status)) : orders.filter((o) => o.status === k));
  const list = inTab(tab);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <Link href="/store" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>الطلبات</h1>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/store/orders?tab=${k}`} style={chipStyle(k === tab)}>
            {label} ({inTab(k).length})
          </Link>
        ))}
      </div>

      <div style={{ fontSize: 13, color: theme.muted, margin: '8px 0 14px' }}>{HINTS[tab]}</div>

      {list.length === 0 && <p style={{ color: theme.muted }}>ما في طلبات هون.</p>}

      {list.map((so) => (
        <div key={so.id}>
          {tab === 'history' && (
            <div style={{ fontSize: 12, color: theme.muted, margin: '0 0 4px' }}>{HISTORY_LABEL[so.status]}</div>
          )}
          <OrderCard so={so} showActions={tab !== 'history'} />
        </div>
      ))}
    </main>
  );
}
