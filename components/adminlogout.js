'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogout() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      style={{ border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
    >
      Log out
    </button>
  );
}
