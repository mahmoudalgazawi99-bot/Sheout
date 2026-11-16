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
    .select('id, name, username, is_active, role')
    .order('created_at', { ascending: true });

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back
      </Link>
      <h1>Couriers & warehouse staff</h1>
      <p style={{ color: '#777', fontSize: 13, lineHeight: 1.7 }}>
        Courier accounts open the courier app (/courier). Warehouse accounts open the warehouse app (/warehouse).
        Both opens either. Passwords are stored encrypted and shown only when created or reset.
      </p>
      <CourierAccounts couriers={data ?? []} />
    </main>
  );
}
