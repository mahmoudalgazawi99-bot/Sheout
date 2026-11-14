'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { NOTE_TAGS } from '@/lib/feedback';

export default function CourierNoteForm({ orderId, existing }) {
  const router = useRouter();
  const [tags, setTags] = useState(existing && existing.tags ? existing.tags : []);
  const [note, setNote] = useState(existing && existing.note ? existing.note : '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function toggle(k) {
    setTags(tags.includes(k) ? tags.filter((t) => t !== k) : [...tags, k]);
    setMsg('');
  }

  async function save() {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/courier/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, tags, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setBusy(false);
        return;
      }
      setMsg('تم حفظ الملاحظة ✓');
      router.refresh();
    } catch {
      setError('مشكلة في الاتصال، حاول مرة أخرى');
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {NOTE_TAGS.map(([k, label]) => {
          const on = tags.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              style={{
                padding: '7px 13px',
                borderRadius: 999,
                fontSize: 13,
                border: `1px solid ${on ? theme.ink : theme.line}`,
                background: on ? theme.ink : theme.card,
                color: on ? theme.gold : theme.ink,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <input
        value={note}
        maxLength={300}
        placeholder="ملاحظة قصيرة عن الزبون (اختياري)"
        onChange={(e) => {
          setNote(e.target.value);
          setMsg('');
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: `1px solid ${theme.line}`,
          background: theme.card,
          fontSize: 15,
          marginTop: 10,
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        style={{
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
        }}
      >
        {busy ? 'جارٍ الحفظ...' : existing ? 'تعديل الملاحظة' : 'حفظ الملاحظة'}
      </button>
      {msg && <p style={{ color: '#177a3c', fontSize: 13, margin: '8px 0 0' }}>{msg}</p>}
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}
