import { redirect } from 'next/navigation';
import { getStoreSession } from '@/lib/storeauth';
import StoreLogout from '@/components/storelogout';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function StoreHome() {
  const account = await getStoreSession();
  if (!account) redirect('/store/login');

  const storeName = (account.stores && (account.stores.name_ar || account.stores.name)) || '';

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 24, margin: 0 }}>{storeName}</h1>
        <StoreLogout />
      </div>
      <p style={{ color: theme.muted }}>أهلاً فيك. طلبات المحل رح تظهر هون قريباً.</p>
    </main>
  );
}
