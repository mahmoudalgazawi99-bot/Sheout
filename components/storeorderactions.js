'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

const NEXT = { new: 'confirmed', confirmed: 'ready' };
const LABEL = { new: 'قبول الطلب', confirmed: 'جاهز للاستلام' };
const REASONS = [
  ['out_of_stock', 'المنتج غير متوفر'],
  ['size_color', 'المقاس أو اللون غير متوفر'],
  ['other', 'سبب آخر'],
];

export default function StoreOrderActions({ id, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('out_of_stock');
  const [note, setNote] = useState('');
  const [reported, setReported] = useState('');

  if (!NEXT[status]) return null;

  async function advance() {
    if (status === 'confirmed' && !window.confirm('هل المنتج جاهز فعلاً للاستلام؟')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/store/sub-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: NEXT[status] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'تعذّر تحديث الحالة');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('مشكلة في الاتصال، حاول مرة أخرى');
    }
    setLoading(false);
  }

  async function report() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/store/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subOrderId: id, reason, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'تعذّر إرسال البلاغ');
        setLoading(false);
        return;
      }
      setReported('تم إبلاغ الإدارة، رح يتواصلوا معك');
      setReporting(false);
      setNote('');
    } catch {
      setError('مشكلة في الاتصال، حاول مرة أخرى');
    }
    setLoading(false);
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

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={advance}
        disabled={loading}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 999,
          border: 'none',
          background: loading ? '#bbb' : theme.ink,
          color: loading ? '#fff' : theme.gold,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {loading ? 'جارٍ التحديث...' : LABEL[status]}
      </button>

      {reported ? (
        <p style={{ color: '#177a3c', fontSize: 13, margin: '10px 0 0', textAlign: 'center' }}>{reported}</p>
      ) : !reporting ? (
        <button
          type="button"
          onClick={() => {
            setReporting(true);
            setError('');
          }}
          style={{
            display: 'block',
            margin: '10px auto 0',
            border: 'none',
            background: 'none',
            color: theme.muted,
            fontSize: 13,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          أبلّغ عن مشكلة
        </button>
      ) : (
        <div style={{ marginTop: 12, padding: 12, border: `1px solid ${theme.line}`, borderRadius: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>شو المشكلة؟</div>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={field}>
            {REASONS.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <input
            placeholder="ملاحظة (اختياري)"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            style={field}
          />
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 8, lineHeight: 1.7 }}>
            الإدارة بتتواصل معك وبتقرر. ما بتقدر تلغي الطلب من هون.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={report}
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 999,
                border: 'none',
                background: theme.ink,
                color: theme.gold,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              إرسال
            </button>
            <button
              type="button"
              onClick={() => setReporting(false)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 999,
                border: `1px solid ${theme.line}`,
                background: theme.card,
                cursor: 'pointer',
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}
