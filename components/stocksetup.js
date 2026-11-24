'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StockSetupButtons({ remaining }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  async function run(mode) {
    const text =
      mode === 'each'
        ? 'كل مقاس ولون بياخذ نفس كمية المنتج الحالية (المجموع بيزيد). مناسب للعرض التجريبي. متأكد؟'
        : 'كمية المنتج بتنقسم بالتساوي على المقاسات والألوان (المجموع بيضل نفسه). متأكد؟';
    if (!window.confirm(text)) return;
    setBusy(mode);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/stock-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'حدث خطأ' });
      } else {
        setMsg({ ok: true, text: `تم إعداد ${data.productsDone} منتج (${data.created} مقاس/لون)` });
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: 'مشكلة في الاتصال، حاول مرة أخرى' });
    }
    setBusy('');
  }

  const btn = (dark) => ({
    width: '100%',
    padding: 14,
    borderRadius: 999,
    border: dark ? 'none' : '1px solid #111',
    background: dark ? '#111' : '#fff',
    color: dark ? '#fff' : '#111',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 10,
  });

  if (remaining === 0) {
    return <p style={{ color: '#177a3c' }}>كل المنتجات إلها مخزون مقاسات. ما في شي تعمله هون.</p>;
  }

  return (
    <div>
      <button type="button" style={btn(true)} disabled={!!busy} onClick={() => run('each')}>
        {busy === 'each' ? 'جارٍ الإعداد...' : 'كل مقاس = كمية المنتج (للعرض التجريبي)'}
      </button>
      <button type="button" style={btn(false)} disabled={!!busy} onClick={() => run('split')}>
        {busy === 'split' ? 'جارٍ الإعداد...' : 'قسمة الكمية بالتساوي (للمنتجات الحقيقية)'}
      </button>
      {msg && <p style={{ color: msg.ok ? '#177a3c' : '#b00', fontSize: 14 }}>{msg.text}</p>}
    </div>
  );
}
