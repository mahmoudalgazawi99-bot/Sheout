'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderWhatsApp({ waBase, messages, orderId, confirmedAt }) {
  const router = useRouter();
  const [key, setKey] = useState(messages[0].key);
  const [text, setText] = useState(messages[0].text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const href = waBase ? `${waBase}?text=${encodeURIComponent(text)}` : '';

  function pick(m) {
    setKey(m.key);
    setText(m.text);
  }

  async function setConfirmed(value) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/order-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, confirmed: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
      } else {
        router.refresh();
      }
    } catch {
      setError('مشكلة في الاتصال، حاول مرة أخرى');
    }
    setBusy(false);
  }

  const chip = (active) => ({
    padding: '6px 12px',
    borderRadius: 999,
    fontSize: 13,
    border: `1px solid ${active ? '#111' : '#ddd'}`,
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#111',
    cursor: 'pointer',
  });

  return (
    <div dir="rtl" lang="ar" style={{ border: '1px solid #cfe8d6', background: '#f4fbf6', borderRadius: 12, padding: 12, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>واتساب للزبون</div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {messages.map((m) => (
          <button key={m.key} type="button" onClick={() => pick(m)} style={chip(m.key === key)}>
            {m.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        rows={6}
        onChange={(e) => setText(e.target.value)}
        style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', lineHeight: 1.7 }}
      />

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '10px 20px',
            borderRadius: 999,
            background: '#177a3c',
            color: '#fff',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          فتح واتساب
        </a>
      ) : (
        <div style={{ color: '#b00', fontSize: 13, marginTop: 8 }}>رقم الزبون غير صالح لواتساب.</div>
      )}

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cfe8d6', fontSize: 14 }}>
        {confirmedAt ? (
          <div>
            <b style={{ color: '#177a3c' }}>✓ الزبون أكّد الطلب</b>{' '}
            <span style={{ color: '#777', fontSize: 12 }}>({confirmedAt})</span>
            <div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmed(false)}
                style={{ marginTop: 6, border: 'none', background: 'none', color: '#b00', fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                إلغاء التأكيد
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmed(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid #111',
              background: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {busy ? '...' : 'سجّل: الزبون أكّد الطلب'}
          </button>
        )}
        {error && <div style={{ color: '#b00', fontSize: 13, marginTop: 6 }}>{error}</div>}
      </div>
    </div>
  );
}
