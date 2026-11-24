'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function api(body) {
  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data, error: data.error || '' };
  } catch {
    return { ok: false, data: {}, error: 'مشكلة في الاتصال، حاول مرة أخرى' };
  }
}

const tiny = { border: '1px solid #ddd', background: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer' };

export default function StockEditor({ productId, initial }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [fillN, setFillN] = useState('5');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const total = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const setQty = (id, val) => setRows(rows.map((r) => (r.id === id ? { ...r, quantity: val } : r)));

  async function sync() {
    setBusy('sync');
    setMsg(null);
    const r = await api({ action: 'sync_variants', id: productId });
    setBusy('');
    if (!r.ok) {
      setMsg({ ok: false, text: r.error || 'تعذّر التحديث' });
      return;
    }
    setRows(r.data.variants);
    setMsg({ ok: true, text: 'تم تحديث الصفوف من مقاسات وألوان المنتج (الجديدة كميتها 0)' });
  }

  function fillAll() {
    const n = Math.max(0, Math.floor(Number(fillN) || 0));
    setRows(rows.map((r) => ({ ...r, quantity: n })));
  }

  async function save() {
    setBusy('save');
    setMsg(null);
    const r = await api({
      action: 'save_stock',
      id: productId,
      variants: rows.map((x) => ({ id: x.id, quantity: x.quantity === '' ? 0 : x.quantity })),
    });
    setBusy('');
    if (!r.ok) {
      setMsg({ ok: false, text: r.error || 'تعذّر الحفظ' });
      return;
    }
    setMsg({ ok: true, text: `تم الحفظ. مجموع المخزون ${r.data.total}` });
    router.refresh();
  }

  return (
    <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 16, background: '#fff' }}>
      <h3 style={{ margin: '0 0 6px' }}>المخزون (مقاس/لون)</h3>
      <div style={{ fontSize: 12, color: '#777', marginBottom: 10, lineHeight: 1.7 }}>
        الكمية الكلية للمنتج = مجموع الصفوف تحت. لا تعدّل الكمية من مكان ثاني، وعدّلها من هون.
      </div>

      {rows.length === 0 && (
        <div style={{ color: '#777', fontSize: 14, marginBottom: 8 }}>
          ما في صفوف مخزون لهالمنتج. اضغط "تحديث الصفوف" وبتنعمل من المقاسات والألوان.
        </div>
      )}

      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderTop: '1px solid #f1f1f1' }}>
          <div style={{ flex: 1, fontSize: 14 }}>
            <b>{r.size || '—'}</b> <span style={{ color: '#777' }}>/ {r.color || '—'}</span>
          </div>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={r.quantity}
            onChange={(e) => setQty(r.id, e.target.value)}
            dir="ltr"
            style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, textAlign: 'center' }}
          />
        </div>
      ))}

      <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14 }}>المجموع: {total}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
        <button type="button" style={tiny} disabled={!!busy} onClick={sync}>
          {busy === 'sync' ? '...' : 'تحديث الصفوف من المنتج'}
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={fillN}
          onChange={(e) => setFillN(e.target.value)}
          dir="ltr"
          style={{ width: 64, padding: 6, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, textAlign: 'center' }}
        />
        <button type="button" style={tiny} onClick={fillAll}>
          اجعل الكل = هالرقم
        </button>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!!busy}
        style={{
          marginTop: 12,
          padding: '10px 20px',
          borderRadius: 999,
          border: 'none',
          background: busy ? '#bbb' : '#111',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {busy === 'save' ? 'جارٍ الحفظ...' : 'حفظ المخزون'}
      </button>
      {msg && <div style={{ fontSize: 13, marginTop: 8, color: msg.ok ? '#177a3c' : '#b00' }}>{msg.text}</div>}
    </section>
  );
}
