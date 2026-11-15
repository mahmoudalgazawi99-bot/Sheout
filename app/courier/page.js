import { redirect } from 'next/navigation';
import { getCourierSession, canPickup, canWarehouse, roleLabel } from '@/lib/courierauth';
import { loadPickup, loadDelivery, loadWarehouse, loadCourierHistory } from '@/lib/courierdata';
import CourierLogout from '@/components/courierlogout';
import PushSetup from '@/components/pushsetup';
import { MenuGrid, MenuCard, StatStrip, Banner } from '@/components/appmenu';
import { jd } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function CourierHome() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');

  const doPickup = canPickup(account.role);
  const doWh = canWarehouse(account.role);

  const pickup = doPickup ? await loadPickup(account.id) : null;
  const delivery = doPickup ? await loadDelivery(account.id) : null;
  const wh = doWh ? await loadWarehouse() : null;
  const history = doPickup ? await loadCourierHistory(account.id) : null;

  const readyCount = pickup ? pickup.readyCount : 0;
  const carryingCount = pickup ? pickup.carrying.length : 0;
  const availableCount = delivery ? delivery.available.length : 0;
  const mineCount = delivery ? delivery.mine.length : 0;
  const incomingParcels = wh ? wh.incoming.reduce((n, e) => n + e.arriving.length, 0) : 0;
  const toPackCount = wh ? wh.toPack.length : 0;
  const packedCount = wh ? wh.packed.length : 0;

  let banner = { href: '/courier', text: 'ما في طلبات حالياً', dark: false };
  if (mineCount > 0) banner = { href: '/courier/deliver', text: `عندك ${mineCount} طلب للتوصيل`, dark: true };
  else if (carryingCount > 0) banner = { href: '/courier/pickup', text: `معك ${carryingCount} طرد للمستودع`, dark: true };
  else if (toPackCount > 0) banner = { href: '/courier/pack', text: `${toPackCount} طلب جاهز للتجهيز`, dark: true };
  else if (availableCount > 0) banner = { href: '/courier/deliver', text: `${availableCount} طلب جاهز بالمستودع للتوصيل`, dark: true };
  else if (incomingParcels > 0) banner = { href: '/courier/receive', text: `${incomingParcels} طرد بالطريق للمستودع`, dark: false };
  else if (readyCount > 0) banner = { href: '/courier/pickup', text: `${readyCount} طرد جاهز للاستلام من المحلات`, dark: false };

  let strip;
  if (doPickup && doWh) {
    strip = [
      { label: 'للاستلام', value: readyCount },
      { label: 'للتجهيز', value: toPackCount },
      { label: 'للتوصيل', value: mineCount + availableCount },
    ];
  } else if (doWh) {
    strip = [
      { label: 'بالطريق للمستودع', value: incomingParcels },
      { label: 'للتجهيز', value: toPackCount },
      { label: 'مجهّزة', value: packedCount },
    ];
  } else {
    strip = [
      { label: 'للاستلام', value: readyCount },
      { label: 'معك للمستودع', value: carryingCount },
      { label: 'للتوصيل', value: mineCount + availableCount },
    ];
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

      <StatStrip items={strip} />

      <MenuGrid>
        {doPickup && (
          <MenuCard
            href="/courier/pickup"
            icon="🏪"
            title="للاستلام من المحلات"
            sub="ثم سلّمها للمستودع"
            badge={readyCount + carryingCount}
          />
        )}
        {doWh && (
          <MenuCard
            href="/courier/receive"
            icon="📥"
            title="استلام بالمستودع"
            sub="طرود المناديب"
            badge={incomingParcels}
          />
        )}
        {doWh && (
          <MenuCard href="/courier/pack" icon="📦" title="تجهيز الطلبات" sub="تجميع وتغليف" badge={toPackCount} />
        )}
        {doPickup && (
          <MenuCard
            href="/courier/deliver"
            icon="🛵"
            title="التوصيل للزبائن"
            sub="من المستودع للزبون"
            badge={availableCount + mineCount}
          />
        )}
        {doPickup && history && (
          <MenuCard href="/courier/history" icon="🧾" title="سجل التوصيل" sub={`${jd(history.todayTotal)} اليوم`} />
        )}
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
