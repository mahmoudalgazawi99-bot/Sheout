'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { t } from '@/lib/i18n';
import { PRESETS } from '@/lib/sizeguide';

const CATS = ['Women', 'Men', 'Kids', 'Shoes', 'Sports', 'Accessories'];
const TOPICS = [
  ['stock', 'تحديث كمية'],
  ['price', 'تعديل سعر'],
  ['payout', 'مستحقات ودفعات'],
  ['order', 'استفسار عن طلب'],
  ['other', 'أخرى'],
];

function shrink(file, maxDim = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad image'));
    };
    img.src = url;
  });
}

async function post(url, body) {
  try {
    const res = await fetch(url, {
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
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${theme.line}`,
  background: theme.card,
  fontSize: 16,
  marginTop: 8,
  boxSizing: 'border-box',
};

const primary = (busy) => ({
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
});

const chipBtn = (active) => ({
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 13,
  border: `1px solid ${active ? theme.ink : theme.line}`,
  background: active ? theme.ink : theme.card,
  color: active ? theme.gold : theme.ink,
  cursor: 'pointer',
});

const cellH = { padding: '6px 4px', fontSize: 12, textAlign: 'center', color: theme.muted };

function ImagePicker({ images, setImages, max = 3, big = false }) {
  async function onPick(e) {
    const files = Array.from(e.target.files || []).slice(0, max - images.length);
    e.target.value = '';
    const out = [];
    for (const f of files) {
      try {
        out.push(await shrink(f, big ? 1100 : 1000, 0.72));
      } catch {}
    }
    setImages([...images, ...out].slice(0, max));
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {images.map((src, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={src} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10 }} />
            <button
              type="button"
              onClick={() => setImages(images.filter((_, j) => j !== i))}
              aria-label="حذف"
              style={{
                position: 'absolute',
                top: -6,
                insetInlineEnd: -6,
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: 'none',
                background: '#b00',
                color: '#fff',
                fontSize: 14,
                lineHeight: '22px',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        ))}
        {images.length < max && (
          <label
            style={{
              display: 'inline-block',
              padding: '8px 14px',
              borderRadius: 999,
              border: `1px dashed ${theme.muted}`,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            + صورة ({images.length}/{max})
            <input type="file" accept="image/*" multiple onChange={onPick} style={{ display: 'none' }} />
          </label>
        )}
      </div>
    </div>
  );
}

export function StoreComposer() {
  const router = useRouter();
  const [mode, setMode] = useState('text');
  const [topic, setTopic] = useState('other');
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [pf, setPf] = useState({
    name_ar: '',
    name_en: '',
    category: 'Women',
    price: '',
    sale_price: '',
    quantity: '',
    sizes: '',
    colors: '',
    description: '',
    model_info: '',
  });
  const [preset, setPreset] = useState('top');
  const [gv, setGv] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const set = (k) => (e) => setPf({ ...pf, [k]: e.target.value });
  const sizeList = pf.sizes
    .split(/[,،]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
  const cols = PRESETS[preset].cols;

  function setCell(size, k, val) {
    setGv((g) => {
      const row = (g[size] || cols.map(() => '')).slice();
      row[k] = val;
      return { ...g, [size]: row };
    });
  }

  function buildGuide() {
    const rows = sizeList
      .map((s) => ({ size: s, v: cols.map((_, k) => (gv[s] && gv[s][k]) || '') }))
      .filter((r) => r.v.some((x) => x));
    return rows.length > 0 ? { unit: 'cm', cols, rows } : null;
  }

  async function send() {
    setError('');
    setOk('');

    if (mode === 'product') {
      if (images.length === 0) {
        setError('أضف صورة واحدة على الأقل للمنتج');
        return;
      }
      if (images.reduce((s, x) => s + x.length, 0) > 3400000) {
        setError('حجم الصور كبير بالمجموع. قلّل عددها أو جرّب صور أصغر');
        return;
      }
    }

    setBusy(true);
    const body =
      mode === 'text'
        ? { kind: 'text', topic, body: text, images }
        : { kind: 'product_request', payload: { ...pf, size_guide: buildGuide() }, images };
    const r = await post('/api/store/chat', body);
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'تعذّر الإرسال');
      return;
    }
    setText('');
    setImages([]);
    if (mode === 'product') {
      setPf({ ...pf, name_ar: '', name_en: '', price: '', sale_price: '', quantity: '', sizes: '', colors: '', description: '', model_info: '' });
      setGv({});
    }
    setOk(mode === 'text' ? 'تم الإرسال' : 'وصل طلب المنتج للإدارة');
    router.refresh();
  }

  const tab = (active) => ({
    flex: 1,
    padding: 10,
    borderRadius: 999,
    border: `1px solid ${active ? theme.ink : theme.line}`,
    background: active ? theme.ink : theme.card,
    color: active ? theme.gold : theme.ink,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  });

  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.line}`,
        borderRadius: theme.radius,
        boxShadow: theme.shadow,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            setMode('text');
            setImages((im) => im.slice(0, 3));
          }}
          style={tab(mode === 'text')}
        >
          رسالة
        </button>
        <button type="button" onClick={() => setMode('product')} style={tab(mode === 'product')}>
          منتج جديد
        </button>
      </div>

      {mode === 'text' ? (
        <div>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} style={field}>
            {TOPICS.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            value={text}
            rows={3}
            maxLength={1000}
            placeholder="اكتب رسالتك للإدارة"
            onChange={(e) => setText(e.target.value)}
            style={{ ...field, resize: 'vertical' }}
          />
        </div>
      ) : (
        <div>
          <input value={pf.name_ar} onChange={set('name_ar')} placeholder="اسم المنتج بالعربي *" style={field} />
          <input value={pf.name_en} onChange={set('name_en')} placeholder="الاسم بالإنجليزي (اختياري)" dir="ltr" style={field} />
          <select value={pf.category} onChange={set('category')} style={field}>
            {CATS.map((c) => (
              <option key={c} value={c}>
                {t('ar', c)}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={pf.price} onChange={set('price')} placeholder="السعر د.أ *" type="number" inputMode="decimal" dir="ltr" style={field} />
            <input value={pf.sale_price} onChange={set('sale_price')} placeholder="بعد التخفيض" type="number" inputMode="decimal" dir="ltr" style={field} />
          </div>
          <input value={pf.quantity} onChange={set('quantity')} placeholder="الكمية المتوفرة *" type="number" inputMode="numeric" dir="ltr" style={field} />
          <input value={pf.sizes} onChange={set('sizes')} placeholder="المقاسات مفصولة بفاصلة (S, M, L)" dir="ltr" style={field} />
          <input value={pf.colors} onChange={set('colors')} placeholder="الألوان مفصولة بفاصلة (Black, Beige)" dir="ltr" style={field} />

          {sizeList.length > 0 && (
            <div style={{ marginTop: 12, padding: 10, border: `1px dashed ${theme.line}`, borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>📏 دليل المقاسات (اختياري، بالسم)</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                اختار نوع القطعة وعبّي قياس كل مقاس. بيقلل المرتجعات.
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {Object.entries(PRESETS).map(([k, p]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setPreset(k);
                      setGv({});
                    }}
                    style={chipBtn(preset === k)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={cellH}>المقاس</th>
                      {cols.map((c) => (
                        <th key={c} style={cellH}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeList.map((s) => (
                      <tr key={s}>
                        <td style={{ ...cellH, fontWeight: 700, color: theme.ink }}>{s}</td>
                        {cols.map((_, k) => (
                          <td key={k} style={{ padding: 3 }}>
                            <input
                              value={(gv[s] && gv[s][k]) || ''}
                              onChange={(e) => setCell(s, k, e.target.value)}
                              inputMode="text"
                              dir="ltr"
                              placeholder="—"
                              style={{ ...field, marginTop: 0, padding: '8px 6px', width: 72, textAlign: 'center' }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <input
            value={pf.model_info}
            onChange={set('model_info')}
            maxLength={160}
            placeholder="العارضة: طولها 175 سم وبتلبس مقاس M (اختياري)"
            style={field}
          />
          <textarea
            value={pf.description}
            rows={3}
            maxLength={600}
            placeholder="وصف المنتج (اختياري)"
            onChange={set('description')}
            style={{ ...field, resize: 'vertical' }}
          />
        </div>
      )}

      <ImagePicker images={images} setImages={setImages} max={mode === 'product' ? 6 : 3} big={mode === 'product'} />
      {mode === 'product' && (
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 6, lineHeight: 1.7 }}>
          الصور بتبيع المنتج: أضف 3 على الأقل (وجه، ظهر، تفصيل)، ولحد 6. صورة واحدة على الأقل مطلوبة.
        </div>
      )}

      <button type="button" onClick={send} disabled={busy} style={primary(busy)}>
        {busy ? 'جارٍ الإرسال...' : mode === 'text' ? 'إرسال' : 'إرسال طلب المنتج'}
      </button>
      {ok && <p style={{ color: '#177a3c', fontSize: 13, margin: '8px 0 0' }}>{ok}</p>}
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}

export function AdminComposer({ storeId }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setBusy(true);
    setError('');
    const r = await post('/api/admin/chat', { action: 'reply', storeId, body: text, images });
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'تعذّر الإرسال');
      return;
    }
    setText('');
    setImages([]);
    router.refresh();
  }

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}>
      <textarea
        value={text}
        rows={3}
        maxLength={1000}
        placeholder="اكتب ردّك للمحل"
        onChange={(e) => setText(e.target.value)}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box', resize: 'vertical' }}
      />
      <ImagePicker images={images} setImages={setImages} />
      <button type="button" onClick={send} disabled={busy} style={primary(busy)}>
        {busy ? 'جارٍ الإرسال...' : 'إرسال'}
      </button>
      {error && <p style={{ color: '#b00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}
    </div>
  );
}

export function ProductDecision({ messageId, payload }) {
  const router = useRouter();
  const [f, setF] = useState({
    name_ar: payload.name_ar || '',
    name_en: payload.name_en || '',
    price: String(payload.price ?? ''),
    sale_price: payload.sale_price ? String(payload.sale_price) : '',
    quantity: String(payload.quantity ?? ''),
  });
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const small = { padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', minWidth: 0 };

  async function approve() {
    if (!window.confirm('نشر المنتج بالموقع؟')) return;
    setBusy('approve');
    setError('');
    const r = await post('/api/admin/chat', { action: 'approve', messageId, ...f });
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'حدث خطأ');
      return;
    }
    router.refresh();
  }

  async function reject() {
    if (reason.trim().length < 3) {
      setError('اكتب سبب الرفض');
      return;
    }
    setBusy('reject');
    setError('');
    const r = await post('/api/admin/chat', { action: 'reject', messageId, reason });
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'حدث خطأ');
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #ddd' }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>اعتماد ونشر (عدّل لو لازم)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <input value={f.name_ar} onChange={set('name_ar')} placeholder="الاسم عربي" style={small} />
        <input value={f.name_en} onChange={set('name_en')} placeholder="الاسم إنجليزي" dir="ltr" style={small} />
        <input value={f.price} onChange={set('price')} placeholder="السعر" type="number" dir="ltr" style={small} />
        <input value={f.sale_price} onChange={set('sale_price')} placeholder="بعد التخفيض" type="number" dir="ltr" style={small} />
        <input value={f.quantity} onChange={set('quantity')} placeholder="الكمية" type="number" dir="ltr" style={small} />
      </div>
      <button
        type="button"
        onClick={approve}
        disabled={!!busy}
        style={{ marginTop: 8, padding: '9px 18px', borderRadius: 999, border: 'none', background: busy ? '#bbb' : '#177a3c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
      >
        {busy === 'approve' ? 'جارٍ النشر...' : 'اعتماد ونشر'}
      </button>

      <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض" style={{ ...small, flex: 1 }} />
        <button
          type="button"
          onClick={reject}
          disabled={!!busy}
          style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid #b00', background: '#fff', color: '#b00', fontWeight: 600, cursor: 'pointer' }}
        >
          {busy === 'reject' ? '...' : 'رفض'}
        </button>
      </div>
      {error && <div style={{ color: '#b00', fontSize: 13, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
