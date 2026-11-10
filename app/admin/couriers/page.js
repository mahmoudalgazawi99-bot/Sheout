import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import CourierAccounts from '@/components/courieraccounts';

export const dynamic = 'force-dynamic';

export default async function AdminCouriersPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const { data } = await supabaseAdmin
    .from('courier_accounts')
    .select('id, name, username, is_active')
    .order('created_at', { ascending: true });

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to orders
      </Link>
      <h1>Couriers</h1>
      <p style={{ color: '#777', fontSize: 13 }}>
        One account per courier. Passwords are stored encrypted and are shown only when created or reset.
      </p>
      <CourierAccounts couriers={data ?? []} />
    </main>
  );
}
