'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

export default function StoreLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/store/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'تعذّر تسجيل الدخول');
        setLoading(false);
        return;
      }
      router.push('/store');
      router.refresh();
    } catch {
      setError('مشكلة في الاتصال، حاول مرة أخرى');
      setLoading(false);
    }
  }

  const input = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: `1px solid ${theme.line}`,
    background: theme.card,
    fontSize: 16,
    marginTop: 6,
    outline: 'none',
  };

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontFamily: theme.serif, letterSpacing: 4, fontSize: 28, margin: '24px 0 4px', fontWeight: 600 }}>
        SHEOUT
      </h1>
      <div style={{ color: theme.muted, fontSize: 14, marginBottom: 20 }}>تطبيق المحلات</div>

      <label style={{ fontSize: 14, fontWeight: 600 }}>
        اليوزر
        <input
          style={input}
          dir="ltr"
          autoCapitalize="none"
          autoCorrect="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <div style={{ height: 14 }} />
      <label style={{ fontSize: 14, fontWeight: 600 }}>
        كلمة السر
        <input
          style={input}
          dir="ltr"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        style={{
          width: '100%',
          marginTop: 16,
          padding: 16,
          borderRadius: 999,
          border: 'none',
          background: loading ? '#bbb' : theme.ink,
          color: loading ? '#fff' : theme.gold,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
      </button>
    </main>
  );
}
