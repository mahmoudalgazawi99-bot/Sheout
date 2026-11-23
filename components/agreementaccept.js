'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

export default function AgreementAccept() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function accept() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/store/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setBusy(false);
        return;
      }
      router.push('/store');
      router.refresh();
    } catch {
      setError('مشكلة في الاتصال، حاول مرة أخرى');
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.7 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ width: 22, height: 22, marginTop: 4 }}
        />
        <span>قرأت الاتفاقية وأوافق على كل بنودها باسم المحل.</span>
      </label>
      <button
        type="button"
        onClick={accept}
        disabled={!checked || busy}
        style={{
          width: '100%',
          marginTop: 14,
          padding: 14,
          borderRadius: 999,
          border: 'none',
          background: !checked || busy ? '#bbb' : theme.ink,
          color: !checked || busy ? '#fff' : theme.gold,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {busy ? 'جارٍ الحفظ...' : 'أوافق'}
      </button>
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}
