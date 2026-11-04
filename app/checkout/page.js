'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, clearCart } from '@/lib/cart';
import { theme } from '@/lib/theme';
import { useLang } from '@/components/LangProvider';
import LangToggle from '@/components/LangToggle';
import { t, money, translateError } from '@/lib/i18n';

const DELIVERY_FEE = 3;

export default function CheckoutPage() {
  const lang = useLang();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(getCart());
    setReady(true);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + DELIVERY_FEE;

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
  const label = { fontSize: 14, fontWeight: 600 };

  async function placeOrder() {
    setError('');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError(t(lang, 'errFill'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          address,
          notes,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(translateError(lang, data.error));
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/order/${data.orderId}`);
    } catch {
      setError(t(lang, 'errNetwork'));
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/cart" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
          {lang === 'ar' ? '→ ' : '← '}
          {t(lang, 'backToCart')}
        </Link>
        <LangToggle />
      </div>
      <div style={{ margin: '14px 0 16px' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: 0 }}>{t(lang, 'checkout')}</h1>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      {ready && items.length === 0 && <p style={{ color: theme.muted }}>{t(lang, 'cartEmpty')}</p>}

      {items.length > 0 && (
        <>
          <label style={label}>
            {t(lang, 'fullName')}
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            {t(lang, 'phone')}
            <input
              style={{ ...input, textAlign: lang === 'ar' ? 'right' : 'left' }}
              dir="ltr"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            {t(lang, 'address')}
            <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            {t(lang, 'notes')}
            <input style={input} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div
            style={{
              marginTop: 16,
              background: theme.goldSoft,
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {t(lang, 'paymentCod')}
          </div>

          <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14, marginTop: 18, lineHeight: 1.9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t(lang, 'items')}</span>
              <span>{money(lang, subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t(lang, 'delivery')}</span>
              <span>{money(lang, DELIVERY_FEE)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
              <b style={{ fontFamily: theme.serif }}>{t(lang, 'total')}</b>
              <b>{money(lang, total)}</b>
            </div>
          </div>

          {error && <p style={{ color: '#b00' }}>{error}</p>}

          <button
            type="button"
            onClick={placeOrder}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 14,
              padding: 16,
              borderRadius: 999,
              border: 'none',
              background: loading ? '#bbb' : theme.ink,
              color: loading ? '#fff' : theme.gold,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: lang === 'en' ? 0.5 : 0,
            }}
          >
            {loading ? t(lang, 'placing') : t(lang, 'placeOrder')}
          </button>
        </>
      )}
    </main>
  );
}
