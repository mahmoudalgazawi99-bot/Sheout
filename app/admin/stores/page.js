import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import StoreAccounts from '@/components/storeaccounts';

export const dynamic = 'force-dynamic';

export default async function AdminStoresPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const { data: stores } = await supabaseAdmin.from('stores').select('id, name').order('name');
  const { data: accounts } = await supabaseAdmin
    .from('store_accounts')
    .select('id, store_id, username, is_active');

  const byStore = {};
  (accounts ?? []).forEach((a) => {
    byStore[a.store_id] = a;
  });

  const list = (stores ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    account: byStore[s.id]
      ? { id: byStore[s.id].id, username: byStore[s.id].username, is_active: byStore[s.id].is_active }
      : null,
  }));

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to orders
      </Link>
      <h1>Store accounts</h1>
      <p style={{ color: '#777', fontSize: 13 }}>
        One account per store. Passwords are stored encrypted and are shown only when created or reset.
      </p>
      <StoreAccounts stores={list} />
    </main>
  );
}
