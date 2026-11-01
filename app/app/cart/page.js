'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart, setQty, removeItem } from '@/lib/cart';

const money = (v) => `${Number(v).toFixed(2)} JD`;

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => setItems(getCart());
    update();
    setReady(true);
    window.addEventListener('cart-updated', update);
    return () => window.removeEventListener('cart-updated', update);
  }, []);

  const groups = {};
  items.forEach((i) => {
    if (!groups[i.storeId]) groups[i.storeId] = { storeName: i.storeName, items: [] };
    groups[i.storeId].items.push(i);
  });
  const storeIds = Object.keys(groups);
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const qtyBtn = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 16,
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to SHEOUT
      </Link>
      <h1>Your Cart</h1>

      {ready && items.length === 0 && <p style={{ color: '#777' }}>Your cart is empty.</p>}

      {storeIds.map((sid) => {
        const g = groups[sid];
        const subtotal = g.items.reduce((sum, i) => sum + i.price * i.qty, 0);
        return (
          <section key={sid} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px' }}>{g.storeName}</h3>
            {g.items.map((i) => (
              <div key={i.key} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: '1px solid #f3f3f3' }}>
                <img src={i.image || ''} alt={i.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, background: '#f3f3f3' }} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{i.name}</b>
                  <div style={{ fontSize: 12, color: '#777' }}>
                    {[i.size, i.color].filter(Boolean).join(' / ')}
                  </div>
                  <div style={{ marginTop: 4 }}>{money(i.price)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <button type="button" style={qtyBtn} onClick={() => setQty(i.key, i.qty - 1)}>-</button>
                    <span>{i.qty}</span>
                    <button type="button" style={qtyBtn} onClick={() => setQty(i.key, i.qty + 1)}>+</button>
                    <button
                      type="button"
                      onClick={() => removeItem(i.key)}
                      style={{ marginLeft: 'auto', border: 'none', background: 'none', color: '#b00', fontSize: 13 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              Store subtotal: <b>{money(subtotal)}</b>
            </div>
          </section>
        );
      })}

      {items.length > 0 && (
        <div style={{ borderTop: '2px solid #111', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
            <b>Total</b>
            <b>{money(total)}</b>
          </div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
            {storeIds.length} {storeIds.length === 1 ? 'store' : 'stores'} in this order
          </div>
          <button
            type="button"
            disabled
            style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 10, border: 'none', background: '#bbb', color: '#fff', fontSize: 16 }}
          >
            Checkout (coming next)
          </button>
        </div>
      )}
    </main>
  );
}
