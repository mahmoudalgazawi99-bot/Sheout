'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

function Action({ url, body, label, busyLabel, confirmText, dark }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{
          width: dark ? '100%' : 'auto',
          padding: dark ? 14 : '9px 16px',
          borderRadius: 999,
          border: dark ? 'none' : `1px solid ${theme.ink}`,
          background: busy ? '#bbb' : dark ? theme.ink : theme.card,
          color: busy ? '#fff' : dark ? theme.gold : theme.ink,
          fontSize: dark ? 16 : 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {busy ? busyLabel : label}
      </button>
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}

export function PickupButton({ subOrderId }) {
  return (
    <Action
      url="/api/courier/pickup"
      body={{ subOrderId }}
      label="استلمت الطرد"
      busyLabel="جارٍ التأكيد..."
      confirmText="تأكيد استلام الطرد من المحل؟"
    />
  );
}

export function DeliverButton({ orderId, amount }) {
  return (
    <Action
      dark
      url="/api/courier/deliver"
      body={{ orderId }}
      label="تم التوصيل"
      busyLabel="جارٍ التأكيد..."
      confirmText={`تأكيد التوصيل واستلام المبلغ ${amount}؟`}
    />
  );
}
