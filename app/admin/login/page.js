'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Could not log in');
        setLoading(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h1>Admin</h1>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', fontSize: 16 }}
      />
      {error && <p style={{ color: '#b00' }}>{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 10, border: 'none', background: loading ? '#bbb' : '#111', color: '#fff', fontSize: 16 }}
      >
        {loading ? 'Checking...' : 'Log in'}
      </button>
    </main>
  );
}
