import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCourierSession } from '@/lib/courierauth';
import { loadCourierOrders } from '@/lib/courierdata';
import AutoRefresh from '@/components/autorefresh';
import { OrderCard } from '@/components/courierparts';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function CourierPickupPage() {
  const account = await getCourierSession();
  if (!account) redirect('/courier/login');

  const { toPickup } = await loadCourierOrders(account.id);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <Link href="/courier" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: '10px 0' }}>للاستلام من المحلات</h1>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>الأول اللي بيستلم طرد بيصير الطلب إله.</div>

      {toPickup.length === 0 && <p style={{ color: theme.muted }}>ما في طلبات للاستلام حالياً.</p>}
      {toPickup.map((e) => (
        <OrderCard key={e.o.id} e={e} />
      ))}
    </main>
  );
}
