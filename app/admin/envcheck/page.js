import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminauth';

export const dynamic = 'force-dynamic';

const CHECKS = [
  { name: 'VAPID_PUBLIC_KEY', expectedLength: 87 },
  { name: 'VAPID_PRIVATE_KEY', expectedLength: 43 },
  { name: 'VAPID_SUBJECT' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY' },
  { name: 'ADMIN_PASSWORD' },
];

function inspect(check) {
  const v = process.env[check.name];
  if (v === undefined) return { ...check, state: 'MISSING', ok: false };
  if (v.length === 0) return { ...check, state: 'EMPTY', ok: false };

  const hasSpaces = v.trim().length !== v.length;
  let ok = !hasSpaces;
  if (check.expectedLength && v.length !== check.expectedLength) ok = false;
  if (check.name === 'VAPID_SUBJECT' && !(v.startsWith('mailto:') || v.startsWith('https://'))) ok = false;

  return { ...check, state: 'SET', length: v.length, hasSpaces, ok };
}

export default async function EnvCheckPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const rows = CHECKS.map(inspect);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to orders
      </Link>
      <h1>Env check</h1>
      <p style={{ color: '#777', fontSize: 13 }}>Values are never shown. Only presence and length.</p>
      {rows.map((r) => (
        <div
          key={r.name}
          style={{
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            background: r.ok ? '#f2fbf4' : '#fff4f4',
          }}
        >
          <b>{r.name}</b>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {r.state}
            {r.length !== undefined && ` · length ${r.length}`}
            {r.expectedLength && ` (expected ${r.expectedLength})`}
            {r.hasSpaces && ' · has leading/trailing spaces'}
            {r.name === 'VAPID_SUBJECT' && r.state === 'SET' && !r.ok && ' · must start with mailto: or https://'}
          </div>
        </div>
      ))}
    </main>
  );
}
