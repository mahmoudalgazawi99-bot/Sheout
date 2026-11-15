import { redirect } from 'next/navigation';
import { getCourierSession, canWarehouse, roleLabel } from '@/lib/courierauth';
import { loadBoard } from '@/lib/warehousedata';
import CourierLogout from '@/components/courierlogout';
import PushSetup from '@/components/pushsetup';
import { MenuGrid, MenuCard, StatStrip, Banner } from '@/components/appmenu';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function WarehouseHome() {
  const account = await getCourierSession();
  if (!account) redirect('/warehouse/login');
  if (!canWarehouse(account.role)) redirect('/courier');

  const { incoming, toPack, packed } = await loadBoard();
  const incomingParcels = incoming.reduce((n, e) => n + e.arriving.length, 0);
  const waiting = packed.filter((e) => !e.o.courier_id).length;

  let banner = { href: '/warehouse', text: 'ما في شغل حالياً', dark: false };
  if (toPack.length > 0) banner = { href: '/warehouse/pack', text: `${toPack.length} طلب جاهز للتجهيز`, dark: true };
  else if (incomingParcels > 0) {
    banner = { href: '/warehouse/receive', text: `${incomingParcels} طرد بالطريق للمستودع`, dark: true };
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>أهلاً {account.name}</h1>
          <div style={{ fontSize: 12, color: theme.muted }}>مستودع Sheout · {roleLabel(account.role)}</div>
        </div>
        <CourierLogout to="/warehouse/login" />
      </div>

      <Banner href={banner.href} dark={banner.dark}>
        {banner.text}
      </Banner>

      <StatStrip
        items={[
          { label: 'بالطريق للمستودع', value: incomingParcels },
          { label: 'للتجهيز', value: toPack.length, dark: toPack.length > 0 },
          { label: 'مجهّزة بانتظار مندوب', value: waiting },
        ]}
      />

      <MenuGrid>
        <MenuCard
          href="/warehouse/receive"
          icon="📥"
          title="استلام الطرود"
          sub="من المناديب"
          badge={incomingParcels}
        />
        <MenuCard
          href="/warehouse/pack"
          icon="📦"
          title="تجهيز الطلبات"
          sub="تجميع وتغليف"
          badge={toPack.length}
        />
      </MenuGrid>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>إعدادات الإشعارات</summary>
        <PushSetup
          publicKey={process.env.VAPID_PUBLIC_KEY || ''}
          apiBase="/api/courier/push"
          swUrl="/store-sw.js"
          scope="/warehouse"
        />
      </details>
    </main>
  );
}
