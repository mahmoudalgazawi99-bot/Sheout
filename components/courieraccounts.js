'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_LABEL = {
  courier: 'Courier (مندوب)',
  warehouse: 'Warehouse (مستودع)',
  both: 'Both (الاثنين)',
};

export default function CourierAccounts({ couriers }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [reveal, setReveal] = useState(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('courier');
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
    const data = await call({ action: 'create', name, username, role }, 'create');
    if (data && data.password) {
      setReveal({ username: data.username, password: data.password, role });
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

  async function changeRole(accountId, next) {
    await call({ action: 'set_role', accountId, role: next }, `s-${accountId}`);
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
          <b>Send these privately. The password is shown only once.</b>
          <div style={{ marginTop: 8, lineHeight: 2 }}>
            <div>Username: <b>{reveal.username}</b></div>
            <div>Password: <b style={{ letterSpacing: 1 }}>{reveal.password}</b></div>
            {reveal.role === 'warehouse' && <div>App: <b>/warehouse/login</b></div>}
            {reveal.role === 'courier' && <div>App: <b>/courier/login</b></div>}
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
        <h3 style={{ margin: '0 0 8px' }}>New account</h3>
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
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={field}>
            <option value="courier">{ROLE_LABEL.courier}</option>
            <option value="warehouse">{ROLE_LABEL.warehouse}</option>
            <option value="both">{ROLE_LABEL.both}</option>
          </select>
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

      {couriers.length === 0 && <p style={{ color: '#777' }}>No accounts yet.</p>}

      {couriers.map((c) => (
        <section key={c.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12, background: '#fff' }}>
          <h3 style={{ margin: '0 0 6px' }}>{c.name}</h3>
          <div style={{ fontSize: 14 }}>
            Username: <b>{c.username}</b>{' '}
            <span style={{ color: c.is_active ? '#177a3c' : '#b00' }}>({c.is_active ? 'active' : 'disabled'})</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <select
              value={c.role || 'both'}
              disabled={busy === `s-${c.id}`}
              onChange={(e) => changeRole(c.id, e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
            >
              <option value="courier">{ROLE_LABEL.courier}</option>
              <option value="warehouse">{ROLE_LABEL.warehouse}</option>
              <option value="both">{ROLE_LABEL.both}</option>
            </select>
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
