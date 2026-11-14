'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COMPLAINT_STATUS, NOTE_TAGS } from '@/lib/feedback';

async function post(body) {
  try {
    const res = await fetch('/api/admin/feedback', {
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

const field = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 15,
  marginTop: 8,
  boxSizing: 'border-box',
};

const btn = (dark, busy) => ({
  padding: '9px 16px',
  borderRadius: 999,
  border: dark ? 'none' : '1px solid #ddd',
  background: busy ? '#bbb' : dark ? '#111' : '#fff',
  color: busy ? '#fff' : dark ? '#fff' : '#111',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
});

export function ComplaintControls({ id, status, reply }) {
  const router = useRouter();
  const [st, setSt] = useState(status);
  const [text, setText] = useState(reply || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setBusy(true);
    setMsg('');
    const r = await post({ action: 'complaint_update', id, status: st, reply: text });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error || 'حدث خطأ');
      return;
    }
    setMsg('تم الحفظ');
    router.refresh();
  }

  return (
    <div style={{ marginTop: 12 }}>
      <select value={st} onChange={(e) => setSt(e.target.value)} style={field}>
        {COMPLAINT_STATUS.map(([k, ar]) => (
          <option key={k} value={k}>
            {ar}
          </option>
        ))}
      </select>
      <textarea
        value={text}
        rows={3}
        maxLength={500}
        placeholder="ردّك للزبون (بيظهر بصفحة طلبه)"
        onChange={(e) => setText(e.target.value)}
        style={{ ...field, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <button type="button" onClick={save} disabled={busy} style={btn(true, busy)}>
          {busy ? 'جارٍ الحفظ...' : 'حفظ'}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg === 'تم الحفظ' ? '#177a3c' : '#b00' }}>{msg}</span>}
      </div>
    </div>
  );
}

export function ReviewToggle({ id, visible }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const r = await post({ action: 'review_toggle', id });
    setBusy(false);
    if (r.ok) router.refresh();
  }

  return (
    <button type="button" onClick={run} disabled={busy} style={{ ...btn(false, busy), marginTop: 8 }}>
      {busy ? '...' : visible ? 'إخفاء التعليق' : 'إظهار التعليق'}
    </button>
  );
}

export function NoteDelete({ id }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!window.confirm('حذف هذه الملاحظة؟')) return;
    setBusy(true);
    const r = await post({ action: 'note_delete', id });
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

export function AddNoteForm({ customerId }) {
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggle(k) {
    setTags(tags.includes(k) ? tags.filter((t) => t !== k) : [...tags, k]);
  }

  async function save() {
    setBusy(true);
    setError('');
    const r = await post({ action: 'note_add', customerId, tags, note });
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'حدث خطأ');
      return;
    }
    setTags([]);
    setNote('');
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {NOTE_TAGS.map(([k, label]) => {
          const on = tags.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 13,
                border: `1px solid ${on ? '#111' : '#ddd'}`,
                background: on ? '#111' : '#fff',
                color: on ? '#fff' : '#111',
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
        placeholder="ملاحظة (اختياري)"
        onChange={(e) => setNote(e.target.value)}
        style={field}
      />
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={save} disabled={busy} style={btn(true, busy)}>
          {busy ? 'جارٍ الحفظ...' : 'إضافة ملاحظة'}
        </button>
      </div>
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}
