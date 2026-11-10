import { redirect } from 'next/navigation';
import { getCourierSession } from '@/lib/courierauth';
import CourierLogout from '@/components/courierlogout';
import PushSetup from '@/components/pushsetup';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function CourierHome() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>أهلاً {account.name}</h1>
        <CourierLogout />
      </div>

      <PushSetup
        publicKey={process.env.VAPID_PUBLIC_KEY || ''}
        apiBase="/api/courier/push"
        swUrl="/store-sw.js"
        scope="/courier"
      />

      <div
        style={{
          marginTop: 18,
          padding: '14px 16px',
          borderRadius: theme.radius,
          background: theme.goldSoft,
          fontSize: 14,
          lineHeight: 1.8,
        }}
      >
        الطلبات الجاهزة للاستلام رح تظهر هون بالخطوة الجاية. الحين فعّل الإشعارات وجرّب الإشعار التجريبي.
      </div>
    </main>
  );
}
