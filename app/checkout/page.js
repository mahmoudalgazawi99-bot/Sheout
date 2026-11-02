'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, clearCart } from '@/lib/cart';
import { theme } from '@/lib/theme';

const money = (v) => `${Number(v).toFixed(2)} JD`;
const DELIVERY_FEE = 3;

export default function CheckoutPage() {
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
      setError('Please fill in name, phone and address');
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
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/order/${data.orderId}`);
    } catch {
      setError('Network error, please try again');
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/cart" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        ← Back to cart
      </Link>
      <div style={{ margin: '14px 0 16px' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: 0 }}>Checkout</h1>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      {ready && items.length === 0 && <p style={{ color: theme.muted }}>Your cart is empty.</p>}

      {items.length > 0 && (
        <>
          <label style={label}>
            Full name
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            Phone
            <input style={input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            Delivery address
            <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            Notes (optional)
            <input style={input} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div
            style={{
              marginTop: 16,
              background: theme.goldSoft,
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
            }}
          >
            Payment: <b>cash on delivery</b>
          </div>

          <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14, marginTop: 18, lineHeight: 1.9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Items</span><span>{money(subtotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span>{money(DELIVERY_FEE)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
              <b style={{ fontFamily: theme.serif }}>Total</b>
              <b>{money(total)}</b>
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
              letterSpacing: 0.5,
            }}
          >
            {loading ? 'Placing order...' : 'Place order'}
          </button>
        </>
      )}
    </main>
  );
}
