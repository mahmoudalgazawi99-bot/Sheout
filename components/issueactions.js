'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function Btn({ id, action, label, confirmText, danger }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
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
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{
          padding: '9px 16px',
          borderRadius: 999,
          border: danger ? '1px solid #b00' : '1px solid #111',
          background: busy ? '#bbb' : danger ? '#fff' : '#111',
          color: busy ? '#fff' : danger ? '#b00' : '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {busy ? 'جارٍ التنفيذ...' : label}
      </button>
      {error && <div style={{ color: '#b00', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export function IssueButtons({ id, canCancel }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
      <Btn id={id} action="resolve" label="تم الحل" confirmText="تأكيد إغلاق البلاغ؟" />
      {canCancel && (
        <Btn
          id={id}
          action="cancel_part"
          label="إلغاء هذا الجزء"
          danger
          confirmText="بتلغي طرد هذا المحل من الطلب وبتسكّر البلاغ. متأكد؟"
        />
      )}
    </div>
  );
}
