'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PRESETS } from '@/lib/sizeguide';

const MAX_IMAGES = 8;
const MAX_VIDEO_MB = 25;

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

function shrink(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad image'));
    };
    img.src = url;
  });
}

const box = { border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 16, background: '#fff' };
const field = { padding: 9, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, minWidth: 0, boxSizing: 'border-box' };
const btn = (dark, busy) => ({
  padding: '8px 14px',
  borderRadius: 999,
  border: dark ? 'none' : '1px solid #ddd',
  background: busy ? '#bbb' : dark ? '#111' : '#fff',
  color: busy ? '#fff' : dark ? '#fff' : '#111',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});
const tiny = { border: '1px solid #ddd', background: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 12, cursor: 'pointer' };

export default function ProductEditor({ product }) {
  const router = useRouter();
  const g = product.guide;
  const [images, setImages] = useState(product.images);
  const [video, setVideo] = useState(product.video || '');
  const [unit, setUnit] = useState(g && g.unit ? g.unit : 'cm');
  const [cols, setCols] = useState(g && g.cols && g.cols.length ? g.cols : PRESETS.top.cols);
  const [rows, setRows] = useState(g && g.rows ? g.rows : []);
  const [modelInfo, setModelInfo] = useState(product.modelInfo || '');
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState({});

  const note = (k, ok, text) => setNotes((n) => ({ ...n, [k]: { ok, text } }));
  const noteView = (k) =>
    notes[k] && notes[k].text ? (
      <div style={{ fontSize: 13, marginTop: 8, color: notes[k].ok ? '#177a3c' : '#b00' }}>{notes[k].text}</div>
    ) : null;

  async function persistImages(next, okText) {
    setBusy('images');
    const r = await api({ action: 'set_images', id: product.id, images: next });
    setBusy('');
    if (!r.ok) {
      note('images', false, r.error || 'تعذّر الحفظ');
      return;
    }
    setImages(next);
    note('images', true, okText);
    router.refresh();
  }

  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[i], next[j]] = [next[j], next[i]];
    persistImages(next, 'تم تغيير الترتيب');
  }

  function makeMain(i) {
    if (i === 0) return;
    const next = images.slice();
    const [x] = next.splice(i, 1);
    next.unshift(x);
    persistImages(next, 'صارت الصورة الرئيسية');
  }

  function removeImg(i) {
    if (!window.confirm('حذف هذه الصورة من المنتج؟')) return;
    persistImages(
      images.filter((_, j) => j !== i),
      'تم الحذف'
    );
  }

  async function onPickImages(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setBusy('upload');
    note('images', true, '');
    let list = images;
    let done = 0;
    for (const f of files) {
      if (list.length >= MAX_IMAGES) {
        note('images', false, `الحد الأقصى ${MAX_IMAGES} صور`);
        break;
      }
      let dataUrl;
      try {
        dataUrl = await shrink(f);
      } catch {
        note('images', false, 'تعذّر قراءة الصورة');
        continue;
      }
      const r = await api({ action: 'add_image', id: product.id, image: dataUrl });
      if (!r.ok) {
        note('images', false, r.error || 'تعذّر الرفع');
        break;
      }
      list = r.data.images;
      setImages(list);
      done += 1;
    }
    setBusy('');
    if (done > 0) {
      note('images', true, `تم رفع ${done} صورة`);
      router.refresh();
    }
  }

  function applyPreset(key) {
    const pc = PRESETS[key].cols.slice();
    setCols(pc);
    setRows(rows.map((r) => ({ size: r.size, v: pc.map((_, i) => r.v[i] || '') })));
  }
  const setCol = (i, val) => setCols(cols.map((c, j) => (j === i ? val : c)));
  function addCol() {
    if (cols.length >= 4) return;
    setCols([...cols, '']);
    setRows(rows.map((r) => ({ ...r, v: [...r.v, ''] })));
  }
  function delCol(i) {
    if (cols.length <= 1) return;
    setCols(cols.filter((_, j) => j !== i));
    setRows(rows.map((r) => ({ ...r, v: r.v.filter((_, j) => j !== i) })));
  }
  function addRow() {
    if (rows.length >= 14) return;
    setRows([...rows, { size: '', v: cols.map(() => '') }]);
  }
  const delRow = (i) => setRows(rows.filter((_, j) => j !== i));
  const setSize = (i, val) => setRows(rows.map((r, j) => (j === i ? { ...r, size: val } : r)));
  const setCell = (i, k, val) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, v: r.v.map((c, m) => (m === k ? val : c)) } : r)));
  function fillFromSizes() {
    const have = new Set(rows.map((r) => r.size));
    const add = product.sizes.filter((s) => !have.has(s)).map((s) => ({ size: s, v: cols.map(() => '') }));
    setRows([...rows, ...add].slice(0, 14));
  }

  async function saveGuide() {
    setBusy('guide');
    const r = await api({
      action: 'save_guide',
      id: product.id,
      size_guide: { unit, cols, rows },
      model_info: modelInfo,
    });
    setBusy('');
    if (!r.ok) {
      note('guide', false, r.error || 'تعذّر الحفظ');
      return;
    }
    note('guide', true, r.data.saved ? 'تم حفظ الدليل' : 'تم الحفظ (بدون جدول، لأنو الجدول ناقص أو فاضي)');
    router.refresh();
  }

  async function onPickVideo(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
      note('video', false, `الفيديو أكبر من ${MAX_VIDEO_MB} ميجا. قصّره أو سجّله بجودة أقل`);
      return;
    }
    const ext = /quicktime|mov/i.test(f.type) ? 'mov' : /webm/i.test(f.type) ? 'webm' : 'mp4';
    setBusy('video');
    note('video', true, 'جارٍ رفع الفيديو، لا تسكّر الصفحة...');
    try {
      const r = await api({ action: 'video_url', id: product.id, ext });
      if (!r.ok) throw new Error(r.error || 'تعذّر تجهيز الرفع');
      const up = await supabase.storage
        .from('products')
        .uploadToSignedUrl(r.data.path, r.data.token, f, { contentType: f.type || 'video/mp4' });
      if (up.error) throw new Error('تعذّر رفع الفيديو');
      const url = supabase.storage.from('products').getPublicUrl(r.data.path).data.publicUrl;
      const s = await api({ action: 'set_video', id: product.id, video_url: url });
      if (!s.ok) throw new Error(s.error || 'تعذّر الحفظ');
      setVideo(url);
      note('video', true, 'تم رفع الفيديو');
      router.refresh();
    } catch (err) {
      note('video', false, (err && err.message) || 'تعذّر رفع الفيديو');
    }
    setBusy('');
  }

  async function deleteVideo() {
    if (!window.confirm('حذف الفيديو من المنتج؟')) return;
    setBusy('video');
    const r = await api({ action: 'set_video', id: product.id, video_url: null });
    setBusy('');
    if (!r.ok) {
      note('video', false, r.error || 'تعذّر الحذف');
      return;
    }
    setVideo('');
    note('video', true, 'تم الحذف');
    router.refresh();
  }

  return (
    <div>
      <section style={box}>
        <h3 style={{ margin: '0 0 8px' }}>
          الصور ({images.length}/{MAX_IMAGES})
        </h3>
        <div style={{ fontSize: 12, color: '#777', marginBottom: 10, lineHeight: 1.7 }}>
          الصورة الأولى هي الرئيسية (بتظهر بالقوائم وبمعاينة المشاركة). الأفضل: وجه، وظهر، وتفصيل.
        </div>

        {images.length === 0 && <div style={{ color: '#777', fontSize: 14 }}>ما في صور.</div>}
        {images.map((u, i) => (
          <div key={u} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid #f1f1f1' }}>
            <img src={u} alt="" style={{ width: 60, height: 72, objectFit: 'cover', borderRadius: 8, background: '#f3f3f3' }} />
            <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {i === 0 ? (
                <b style={{ fontSize: 12, color: '#177a3c' }}>رئيسية</b>
              ) : (
                <button type="button" style={tiny} disabled={busy === 'images'} onClick={() => makeMain(i)}>
                  اجعلها رئيسية
                </button>
              )}
              <button type="button" style={tiny} disabled={busy === 'images'} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" style={tiny} disabled={busy === 'images'} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button type="button" style={{ ...tiny, color: '#b00' }} disabled={busy === 'images'} onClick={() => removeImg(i)}>
                حذف
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <label style={{ ...btn(true, busy === 'upload'), display: 'inline-block', marginTop: 10 }}>
            {busy === 'upload' ? 'جارٍ الرفع...' : '+ رفع صور'}
            <input type="file" accept="image/*" multiple onChange={onPickImages} disabled={busy === 'upload'} style={{ display: 'none' }} />
          </label>
        )}
        {noteView('images')}
      </section>

      <section style={box}>
        <h3 style={{ margin: '0 0 8px' }}>دليل المقاسات</h3>

        <input
          value={modelInfo}
          maxLength={160}
          onChange={(e) => setModelInfo(e.target.value)}
          placeholder="مثال: العارضة طولها 175 سم وبتلبس مقاس M"
          style={{ ...field, width: '100%' }}
        />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {Object.entries(PRESETS).map(([k, p]) => (
            <button key={k} type="button" style={tiny} onClick={() => applyPreset(k)}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>الأعمدة (لحد 4)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {cols.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 4 }}>
              <input value={c} onChange={(e) => setCol(i, e.target.value)} placeholder="اسم العمود" style={{ ...field, width: 96 }} />
              {cols.length > 1 && (
                <button type="button" style={tiny} onClick={() => delCol(i)}>
                  ×
                </button>
              )}
            </div>
          ))}
          {cols.length < 4 && (
            <button type="button" style={tiny} onClick={addCol}>
              + عمود
            </button>
          )}
          <select value={unit} onChange={(e) => setUnit(e.target.value)} style={field}>
            <option value="cm">سم</option>
            <option value="in">إنش</option>
          </select>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>الصفوف</div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
            <input value={r.size} onChange={(e) => setSize(i, e.target.value)} placeholder="المقاس" style={{ ...field, width: 64 }} />
            {cols.map((_, k) => (
              <input
                key={k}
                value={r.v[k] || ''}
                onChange={(e) => setCell(i, k, e.target.value)}
                placeholder="—"
                inputMode="text"
                dir="ltr"
                style={{ ...field, width: 64 }}
              />
            ))}
            <button type="button" style={tiny} onClick={() => delRow(i)}>
              ×
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" style={tiny} onClick={addRow}>
            + صف
          </button>
          {product.sizes.length > 0 && (
            <button type="button" style={tiny} onClick={fillFromSizes}>
              ملء المقاسات من المنتج ({product.sizes.join(' ')})
            </button>
          )}
        </div>

        <button type="button" onClick={saveGuide} disabled={busy === 'guide'} style={{ ...btn(true, busy === 'guide'), marginTop: 12 }}>
          {busy === 'guide' ? 'جارٍ الحفظ...' : 'حفظ الدليل'}
        </button>
        {noteView('guide')}
      </section>

      <section style={box}>
        <h3 style={{ margin: '0 0 8px' }}>فيديو (اختياري)</h3>
        <div style={{ fontSize: 12, color: '#777', marginBottom: 10, lineHeight: 1.7 }}>
          فيديو قصير (10 إلى 20 ثانية) لحد {MAX_VIDEO_MB} ميجا. على الآيفون: الإعدادات، الكاميرا، التنسيقات، "الأكثر توافقاً"،
          عشان يشتغل عند كل الزبائن.
        </div>
        {video ? (
          <div>
            <video src={video} controls playsInline preload="metadata" style={{ width: '100%', maxWidth: 260, borderRadius: 10, background: '#000' }} />
            <div style={{ marginTop: 8 }}>
              <button type="button" style={{ ...tiny, color: '#b00' }} disabled={busy === 'video'} onClick={deleteVideo}>
                حذف الفيديو
              </button>
            </div>
          </div>
        ) : (
          <label style={{ ...btn(true, busy === 'video'), display: 'inline-block' }}>
            {busy === 'video' ? 'جارٍ الرفع...' : '+ رفع فيديو'}
            <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={onPickVideo} disabled={busy === 'video'} style={{ display: 'none' }} />
          </label>
        )}
        {noteView('video')}
      </section>
    </div>
  );
}
