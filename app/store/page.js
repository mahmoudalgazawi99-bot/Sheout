import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import StoreLogout from '@/components/storelogout';
import PushSetup from '@/components/pushsetup';
import StoreBell from '@/components/storebell';
import AutoRefresh from '@/components/autorefresh';
import { computeStoreLive } from '@/lib/storestats';
import { summarizeStock } from '@/lib/stock';
import { MenuGrid, MenuCard, StatStrip, Banner } from '@/components/appmenu';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function StoreHome() {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const storeName = (account.stores && (account.stores.name_ar || account.stores.name)) || '';

  const { data: subs } = await supabaseAdmin
    .from('sub_orders')
    .select('status')
    .eq('store_id', account.store_id)
    .limit(1000);

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, quantity, status, order_items(count)')
    .eq('store_id', account.store_id);

  const live = computeStoreLive(subs ?? []);
  const stock = summarizeStock(products ?? []);
  const stockAlerts = stock.out.length + stock.low.length;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>{storeName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StoreBell count={live.waiting}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {live.waiting > 0 ? `عندك ${live.waiting} طلب جديد بانتظار القبول` : 'ما في طلبات جديدة حالياً'}
            </div>
            {live.waiting > 0 && (
              <a
                href="/store/orders?tab=new"
                style={{
                  display: 'inline-block',
                  padding: '9px 16px',
                  borderRadius: 999,
                  background: theme.ink,
                  color: theme.gold,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                عرض الطلبات الجديدة
              </a>
            )}
            <PushSetup publicKey={process.env.VAPID_PUBLIC_KEY || ''} />
          </StoreBell>
          <StoreLogout />
        </div>
      </div>

      <Banner href="/store/orders?tab=new" dark={live.waiting > 0}>
        {live.waiting > 0 ? `عندك ${live.waiting} طلب جديد بانتظار القبول` : 'ما في طلبات جديدة حالياً'}
      </Banner>

      <StatStrip
        items={[
          { label: 'بانتظار القبول', value: live.waiting },
          { label: 'قيد التجهيز', value: live.preparing, dark: live.preparing > 0 },
          { label: 'جاهزة للاستلام', value: live.ready },
        ]}
      />

      <MenuGrid>
        <MenuCard href="/store/orders" icon="📥" title="الطلبات" sub="جديدة وقيد التجهيز والسجل" badge={live.waiting} />
        <MenuCard href="/store/stats" icon="📈" title="الإحصائيات" sub="المبيعات والأكثر طلباً" />
        <MenuCard
          href="/store/stock"
          icon="📦"
          title="المخزون"
          sub="الكميات والتنبيهات"
          badge={stockAlerts}
          alert={stockAlerts > 0}
        />
      </MenuGrid>

      <p style={{ marginTop: 28, fontSize: 12, color: theme.muted, textAlign: 'center' }}>
        للمشاكل أو الاستفسارات تواصل مع إدارة المنصة.
      </p>
    </main>
  );
}
