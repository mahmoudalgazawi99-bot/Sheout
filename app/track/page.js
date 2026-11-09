'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { useLang } from '@/components/LangProvider';
import LangToggle from '@/components/LangToggle';

export default function TrackPage() {
  const lang = useLang();
  const ar = lang === 'ar';
  const router = useRouter();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (!code.trim() || !phone.trim()) {
      setError(ar ? 'الرجاء إدخال رقم الطلب ورقم الهاتف' : 'Please enter the order number and phone');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setError(ar ? 'محاولات كثيرة، جرّب بعد شوي' : 'Too many attempts, try again shortly');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(
          ar
            ? 'ما لقينا طلب بهالبيانات. تأكد من رقم الطلب ورقم الهاتف'
            : 'No order found with these details. Check the order number and phone'
        );
        setLoading(false);
        return;
      }
      router.push(`/order/${data.orderId}`);
    } catch {
      setError(ar ? 'مشكلة في الاتصال، حاول مرة أخرى' : 'Network error, please try again');
      setLoading(false);
    }
  }

  const input = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: `1px solid ${theme.line}`,
    background: theme.card,
    fontSize: 16,
    marginTop: 6,
    outline: 'none',
  };

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
          {ar ? '→ ' : '← '}
          {ar ? 'العودة إلى SHEOUT' : 'Back to SHEOUT'}
        </Link>
        <LangToggle />
      </div>

      <div style={{ margin: '18px 0 16px' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: 0 }}>
          {ar ? 'تتبّع طلبك' : 'Track your order'}
        </h1>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      <label style={{ fontSize: 14, fontWeight: 600 }}>
        {ar ? 'رقم الطلب (مثل 20261109-1042-1)' : 'Order number (like 20261109-1042-1)'}
        <input
          style={input}
          dir="ltr"
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={30}
          placeholder="20261109-1042-1"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <div style={{ height: 14 }} />
      <label style={{ fontSize: 14, fontWeight: 600 }}>
        {ar ? 'رقم الهاتف المستخدم بالطلب' : 'Phone number used for the order'}
        <input
          style={input}
          dir="ltr"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        style={{
          width: '100%',
          marginTop: 16,
          padding: 16,
          borderRadius: 999,
          border: 'none',
          background: loading ? '#bbb' : theme.ink,
          color: loading ? '#fff' : theme.gold,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {loading ? (ar ? 'جارٍ البحث...' : 'Searching...') : ar ? 'عرض حالة الطلب' : 'Show order status'}
      </button>
    </main>
  );
}
