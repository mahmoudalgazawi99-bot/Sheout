'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { COMPLAINT_TYPES } from '@/lib/feedback';

async function post(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error || '' };
  } catch {
    return { ok: false, error: '' };
  }
}

const field = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${theme.line}`,
  background: theme.card,
  fontSize: 15,
  marginTop: 8,
  boxSizing: 'border-box',
};

const primary = (busy) => ({
  width: '100%',
  marginTop: 10,
  padding: 12,
  borderRadius: 999,
  border: 'none',
  background: busy ? '#bbb' : theme.ink,
  color: busy ? '#fff' : theme.gold,
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
});

export function ReviewForm({ orderId, productId, existing, lang }) {
  const ar = lang === 'ar';
  const router = useRouter();
  const [rating, setRating] = useState(existing ? existing.rating : 0);
  const [comment, setComment] = useState(existing && existing.comment ? existing.comment : '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function save() {
    if (!rating) {
      setError(ar ? 'اختار عدد النجوم' : 'Choose a rating');
      return;
    }
    setBusy(true);
    setError('');
    setMsg('');
    const r = await post('/api/feedback/review', { orderId, productId, rating, comment });
    setBusy(false);
    if (!r.ok) {
      setError(ar ? r.error || 'تعذّر الإرسال، حاول مرة أخرى' : 'Could not send, please try again.');
      return;
    }
    setMsg(ar ? 'شكراً لتقييمك' : 'Thanks for your review');
    router.refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setRating(n);
              setMsg('');
            }}
            aria-label={`${n}`}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 28,
              lineHeight: 1,
              cursor: 'pointer',
              color: n <= rating ? theme.gold : theme.line,
              padding: 2,
            }}
          >
            ★
          </button>
        ))}
      </div>
      <input
        value={comment}
        maxLength={400}
        placeholder={ar ? 'اكتب تعليقك (اختياري)' : 'Write a comment (optional)'}
        onChange={(e) => setComment(e.target.value)}
        style={field}
      />
      <button type="button" onClick={save} disabled={busy} style={primary(busy)}>
        {busy
          ? ar
            ? 'جارٍ الإرسال...'
            : 'Sending...'
          : existing
            ? ar
              ? 'تعديل التقييم'
              : 'Update review'
            : ar
              ? 'إرسال التقييم'
              : 'Send review'}
      </button>
      {msg && <p style={{ color: '#177a3c', fontSize: 13, margin: '8px 0 0' }}>{msg}</p>}
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}

export function ComplaintForm({ orderId, products, lang }) {
  const ar = lang === 'ar';
  const router = useRouter();
  const [type, setType] = useState('quality');
  const [productId, setProductId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function send() {
    setBusy(true);
    setError('');
    setMsg('');
    const r = await post('/api/feedback/complaint', { orderId, type, productId, message });
    setBusy(false);
    if (!r.ok) {
      setError(ar ? r.error || 'تعذّر الإرسال، حاول مرة أخرى' : 'Could not send, please try again.');
      return;
    }
    setMessage('');
    setMsg(ar ? 'وصلتنا شكواك، رح نتواصل معك قريباً' : 'We received your complaint and will contact you soon');
    router.refresh();
  }

  return (
    <div>
      <select value={type} onChange={(e) => setType(e.target.value)} style={field}>
        {COMPLAINT_TYPES.map(([k, a, e]) => (
          <option key={k} value={k}>
            {ar ? a : e}
          </option>
        ))}
      </select>
      {products.length > 0 && (
        <select value={productId} onChange={(e) => setProductId(e.target.value)} style={field}>
          <option value="">{ar ? 'المنتج المعني (اختياري)' : 'Related product (optional)'}</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <textarea
        value={message}
        maxLength={500}
        rows={4}
        placeholder={ar ? 'اكتب تفاصيل الشكوى' : 'Describe the problem'}
        onChange={(e) => setMessage(e.target.value)}
        style={{ ...field, resize: 'vertical' }}
      />
      <button type="button" onClick={send} disabled={busy} style={primary(busy)}>
        {busy ? (ar ? 'جارٍ الإرسال...' : 'Sending...') : ar ? 'إرسال الشكوى' : 'Send complaint'}
      </button>
      {msg && <p style={{ color: '#177a3c', fontSize: 13, margin: '8px 0 0' }}>{msg}</p>}
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}
