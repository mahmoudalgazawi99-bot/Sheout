import { redirect } from 'next/navigation';
import { getCourierSession, canPickup, roleLabel } from '@/lib/courierauth';
import { loadPickup, loadDelivery, loadCourierHistory } from '@/lib/courierdata';
import { loadMyCash } from '@/lib/couriercash';
import CourierLogout from '@/components/courierlogout';
import PushSetup from '@/components/pushsetup';
import { MenuGrid, MenuCard, StatStrip, Banner } from '@/components/appmenu';
import { jd } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function CourierHome() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');
  if (!canPickup(account.role)) redirect('/warehouse');

  const pickup = await loadPickup(account.id);
  const delivery = await loadDelivery(account.id);
  const history = await loadCourierHistory(account.id);
  const cash = await loadMyCash(account.id);

  const readyCount = pickup.readyCount;
  const carryingCount = pickup.carrying.length;
  const availableCount = delivery.available.length;
  const mineCount = delivery.mine.length;

  let banner = { href: '/courier', text: 'ما في طلبات حالياً', dark: false };
  if (mineCount > 0) banner = { href: '/courier/deliver', text: `عندك ${mineCount} طلب للتوصيل`, dark: true };
  else if (carryingCount > 0) {
    banner = { href: '/courier/pickup', text: `معك ${carryingCount} طرد للمستودع`, dark: true };
  } else if (availableCount > 0) {
    banner = { href: '/courier/deliver', text: `${availableCount} طلب جاهز بالمستودع للتوصيل`, dark: true };
  } else if (readyCount > 0) {
    banner = { href: '/courier/pickup', text: `${readyCount} طرد جاهز للاستلام من المحلات`, dark: false };
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>أهلاً {account.name}</h1>
          <div style={{ fontSize: 12, color: theme.muted }}>{roleLabel(account.role)}</div>
        </div>
        <CourierLogout />
      </div>

      <Banner href={banner.href} dark={banner.dark}>
        {banner.text}
      </Banner>

      <StatStrip
        items={[
          { label: 'للاستلام', value: readyCount },
          { label: 'معك للمستودع', value: carryingCount },
          { label: 'للتوصيل', value: mineCount + availableCount, dark: mineCount > 0 },
        ]}
      />

      <MenuGrid>
        <MenuCard
          href="/courier/pickup"
          icon="🏪"
          title="للاستلام من المحلات"
          sub="ثم سلّمها للمستودع"
          badge={readyCount + carryingCount}
        />
        <MenuCard
          href="/courier/deliver"
          icon="🛵"
          title="التوصيل للزبائن"
          sub="من المستودع للزبون"
          badge={availableCount + mineCount}
        />
        <MenuCard
          href="/courier/cash"
          icon="💵"
          title="رصيدي النقدي"
          sub={cash.balance > 0.009 ? `بذمّتك ${jd(cash.balance)}` : 'ما عليك شي'}
          alert={cash.balance > 0.009}
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
