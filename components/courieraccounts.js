'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CourierAccounts({ couriers }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [reveal, setReveal] = useState(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);

  async function call(body, busyKey) {
    setBusy(busyKey);
    setError('');
    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setBusy('');
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return null;
      }
      router.refresh();
      return data;
    } catch {
      setBusy('');
      setError('Network error');
      return null;
    }
  }

  async function create() {
    const data = await call({ action: 'create', name, username }, 'create');
    if (data && data.password) {
      setReveal({ username: data.username, password: data.password });
      setCopied(false);
      setName('');
      setUsername('');
    }
  }

  async function reset(accountId) {
    const data = await call({ action: 'reset', accountId }, `r-${accountId}`);
    if (data && data.password) {
      setReveal({ username: data.username, password: data.password });
      setCopied(false);
    }
  }

  async function toggle(accountId) {
    await call({ action: 'toggle', accountId }, `t-${accountId}`);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const btn = {
    border: '1px solid #ddd',
    background: '#fff',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
  };
  const field = { flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, minWidth: 0 };

  return (
    <div>
      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {reveal && (
        <div style={{ background: '#fff7e0', border: '1px solid #e2c36b', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <b>Send these to the courier. The password is shown only once.</b>
          <div style={{ marginTop: 8, lineHeight: 2 }}>
            <div>Username: <b>{reveal.username}</b></div>
            <div>Password: <b style={{ letterSpacing: 1 }}>{reveal.password}</b></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              style={btn}
              onClick={() => copy(`Username: ${reveal.username}\nPassword: ${reveal.password}`)}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" style={btn} onClick={() => setReveal(null)}>Hide</button>
          </div>
        </div>
      )}

      <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 16, background: '#fff' }}>
        <h3 style={{ margin: '0 0 8px' }}>New courier</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} style={field} />
          <input
            placeholder="username (e.g. ahmad)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            style={field}
          />
          <button
            type="button"
            style={{ ...btn, background: '#111', color: '#fff' }}
            disabled={busy === 'create'}
            onClick={create}
          >
            Create
          </button>
        </div>
      </section>

      {couriers.length === 0 && <p style={{ color: '#777' }}>No couriers yet.</p>}

      {couriers.map((c) => (
        <section key={c.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12, background: '#fff' }}>
          <h3 style={{ margin: '0 0 6px' }}>{c.name}</h3>
          <div style={{ fontSize: 14 }}>
            Username: <b>{c.username}</b>{' '}
            <span style={{ color: c.is_active ? '#177a3c' : '#b00' }}>({c.is_active ? 'active' : 'disabled'})</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" style={btn} disabled={busy === `r-${c.id}`} onClick={() => reset(c.id)}>
              Reset password
            </button>
            <button type="button" style={btn} disabled={busy === `t-${c.id}`} onClick={() => toggle(c.id)}>
              {c.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
