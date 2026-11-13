import { redirect } from 'next/navigation';
import { getCourierSession } from '@/lib/courierauth';
import { loadCourierOrders, loadCourierHistory } from '@/lib/courierdata';
import CourierLogout from '@/components/courierlogout';
import PushSetup from '@/components/pushsetup';
import AutoRefresh from '@/components/autorefresh';
import { MenuGrid, MenuCard, StatStrip, Banner } from '@/components/appmenu';
import { jd } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function CourierHome() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');

  const { deliverNow, toPickup } = await loadCourierOrders(account.id);
  const history = await loadCourierHistory(account.id);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>أهلاً {account.name}</h1>
        <CourierLogout />
      </div>

      <Banner href={deliverNow.length > 0 ? '/courier/deliver' : '/courier/pickup'} dark={deliverNow.length > 0}>
        {deliverNow.length > 0
          ? `عندك ${deliverNow.length} طلب جاهز للتوصيل`
          : toPickup.length > 0
            ? `${toPickup.length} طلب للاستلام من المحلات`
            : 'ما في طلبات حالياً'}
      </Banner>

      <StatStrip
        items={[
          { label: 'للاستلام', value: toPickup.length },
          { label: 'للتوصيل', value: deliverNow.length, dark: deliverNow.length > 0 },
          { label: 'موصّل اليوم', value: history.todayRows.length },
        ]}
      />

      <MenuGrid>
        <MenuCard
          href="/courier/pickup"
          icon="🏪"
          title="للاستلام من المحلات"
          sub="الطرود الجاهزة"
          badge={toPickup.length}
        />
        <MenuCard
          href="/courier/deliver"
          icon="🛵"
          title="جاهزة للتوصيل"
          sub="بعد استلام كل الطرود"
          badge={deliverNow.length}
        />
        <MenuCard href="/courier/history" icon="🧾" title="سجل التوصيل" sub={`${jd(history.todayTotal)} اليوم`} />
      </MenuGrid>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>إعدادات الإشعارات</summary>
        <PushSetup
          publicKey={process.env.VAPID_PUBLIC_KEY || ''}
          apiBase="/api/courier/push"
          swUrl="/store-sw.js"
          scope="/courier"
        />
      </details>
    </main>
  );
}
