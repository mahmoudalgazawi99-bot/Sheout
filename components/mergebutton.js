'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MergeButton({ primaryId, otherIds, saved }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    const ok = window.confirm(
      `دمج ${otherIds.length + 1} طلبات بطلب واحد؟ بتوفّر ${saved} د.أ رسوم توصيل، وما بتقدر ترجّع الدمج.`
    );
    if (!ok) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId, otherIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError('مشكلة في الاتصال، حاول مرة أخرى');
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{
          padding: '10px 18px',
          borderRadius: 999,
          border: 'none',
          background: busy ? '#bbb' : '#111',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {busy ? 'جارٍ الدمج...' : 'دمج الطلبات'}
      </button>
      {error && <div style={{ color: '#b00', fontSize: 13, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
