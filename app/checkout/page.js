'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, clearCart } from '@/lib/cart';

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
    padding: 12,
    borderRadius: 10,
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    fontSize: 16,
    marginTop: 6,
  };

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
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/cart" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to cart
      </Link>
      <h1>Checkout</h1>

      {ready && items.length === 0 && <p style={{ color: '#777' }}>Your cart is empty.</p>}

      {items.length > 0 && (
        <>
          <label>
            Full name
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div style={{ height: 12 }} />
          <label>
            Phone
            <input style={input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <div style={{ height: 12 }} />
          <label>
            Delivery address
            <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <div style={{ height: 12 }} />
          <label>
            Notes (optional)
            <input style={input} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <p style={{ fontSize: 14, color: '#555' }}>Payment: cash on delivery</p>

          <div style={{ borderTop: '2px solid #111', paddingTop: 12, lineHeight: 1.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Items</span><span>{money(subtotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span>{money(DELIVERY_FEE)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}><b>Total</b><b>{money(total)}</b></div>
          </div>

          {error && <p style={{ color: '#b00' }}>{error}</p>}

          <button
            type="button"
            onClick={placeOrder}
            disabled={loading}
            style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 10, border: 'none', background: loading ? '#bbb' : '#111', color: '#fff', fontSize: 16 }}
          >
            {loading ? 'Placing order...' : 'Place order'}
          </button>
        </>
      )}
    </main>
  );
}
