import Link from 'next/link';
import { redirect } from 'next/navigation';
import webpush from 'web-push';
import { isAdmin } from '@/lib/adminauth';
import CopyField from '@/components/copyfield';

export const dynamic = 'force-dynamic';

export default async function VapidPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const keys = webpush.generateVAPIDKeys();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to orders
      </Link>
      <h1>Push keys</h1>
      <p style={{ color: '#b00', fontSize: 14, lineHeight: 1.6 }}>
        A new pair is generated every time this page loads. Copy BOTH values from this same load,
        and do not refresh in between. Never share the private key.
      </p>
      <CopyField label="VAPID_PUBLIC_KEY" value={keys.publicKey} />
      <CopyField label="VAPID_PRIVATE_KEY (secret)" value={keys.privateKey} />
    </main>
  );
}
