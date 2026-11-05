'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

const NEXT = { new: 'confirmed', confirmed: 'ready' };
const LABEL = { new: 'قبول الطلب', confirmed: 'جاهز للاستلام' };

export default function StoreOrderActions({ id, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}
