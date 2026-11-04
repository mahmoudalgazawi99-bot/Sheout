'use client';

import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

export default function StoreLogout() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/store/logout', { method: 'POST' });
    router.push('/store/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      style={{
        border: `1px solid ${theme.line}`,
        background: theme.card,
        borderRadius: 999,
        padding: '8px 14px',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      تسجيل الخروج
    </button>
  );
}
