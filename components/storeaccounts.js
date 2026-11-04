'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StoreAccounts({ stores }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [reveal, setReveal] = useState(null);
  const [names, setNames] = useState({});
  const [copied, setCopied] = useState(false);

  async function call(body, busyKey) {
    setBusy(busyKey);
    setError('');
    try {
      const res = await fetch('/api/admin/store-accounts', {
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

  async function create(storeId) {
    const data = await call({ action: 'create', storeId, username: names[storeId] || '' }, `c-${storeId}`);
    if (data && data.password) {
      setReveal({ username: data.username, password: data.password });
      setCopied(false);
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

  return (
    <div>
      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {reveal && (
        <div style={{ background: '#fff7e0', border: '1px solid #e2c36b', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <b>Send these to the store owner. The password is shown only once.</b>
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

      {stores.map((s) => (
        <section key={s.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12, background: '#fff' }}>
          <h3 style={{ margin: '0 0 8px' }}>{s.name}</h3>

          {s.account ? (
            <div>
              <div style={{ fontSize: 14 }}>
                Username: <b>{s.account.username}</b>{' '}
                <span style={{ color: s.account.is_active ? '#177a3c' : '#b00' }}>
                  ({s.account.is_active ? 'active' : 'disabled'})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={btn}
                  disabled={busy === `r-${s.account.id}`}
                  onClick={() => reset(s.account.id)}
                >
                  Reset password
                </button>
                <button
                  type="button"
                  style={btn}
                  disabled={busy === `t-${s.account.id}`}
                  onClick={() => toggle(s.account.id)}
                >
                  {s.account.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="username (e.g. urban)"
                value={names[s.id] || ''}
                onChange={(e) => setNames({ ...names, [s.id]: e.target.value })}
                autoCapitalize="none"
                autoCorrect="off"
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}
              />
              <button
                type="button"
                style={{ ...btn, background: '#111', color: '#fff' }}
                disabled={busy === `c-${s.id}`}
                onClick={() => create(s.id)}
              >
                Create
              </button>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
