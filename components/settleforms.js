'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function call(body) {
  try {
    const res = await fetch('/api/admin/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error || '' };
  } catch {
    return { ok: false, error: 'مشكلة في الاتصال، حاول مرة أخرى' };
  }
}

const field = { padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, minWidth: 0, boxSizing: 'border-box' };

function Form({ action, idKey, idValue, balance, label, withMethod }) {
  const router = useRouter();
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : '');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!window.confirm(`تأكيد تسجيل ${amount || 0} د.أ؟`)) return;
    setBusy(true);
    setError('');
    const r = await call({ action, [idKey]: idValue, amount, method, note });
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'حدث خطأ');
      return;
    }
    setNote('');
    setMethod('');
    router.refresh();
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="المبلغ"
          dir="ltr"
          style={{ ...field, width: 110 }}
        />
        {withMethod && (
          <input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="الطريقة (نقد، CliQ...)" style={{ ...field, flex: 1 }} />
        )}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (اختياري)" style={{ ...field, flex: 1 }} />
      </div>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        style={{
          marginTop: 8,
          padding: '9px 18px',
          borderRadius: 999,
          border: 'none',
          background: busy ? '#bbb' : '#111',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {busy ? 'جارٍ الحفظ...' : label}
      </button>
      {error && <div style={{ color: '#b00', fontSize: 13, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

export function HandoverForm({ courierId, balance }) {
  return <Form action="cash_receive" idKey="courierId" idValue={courierId} balance={balance} label="استلمت النقد" />;
}

export function PayoutForm({ storeId, balance }) {
  return <Form action="store_payout" idKey="storeId" idValue={storeId} balance={balance} label="تسجيل الدفعة" withMethod />;
}

export function DeleteRecord({ kind, id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!window.confirm('حذف هذا التسجيل؟')) return;
    setBusy(true);
    const r = await call({ action: 'delete_record', kind, id });
    setBusy(false);
    if (r.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      style={{ border: 'none', background: 'none', color: '#b00', fontSize: 12, cursor: 'pointer', padding: 0 }}
    >
      حذف
    </button>
  );
}
