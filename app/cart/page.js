'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart, setQty, removeItem } from '@/lib/cart';
import { theme } from '@/lib/theme';

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
    width: 34,
    height: 34,
    borderRadius: 999,
    border: `1px solid ${theme.line}`,
    background: theme.card,
    color: theme.ink,
    fontSize: 16,
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        ← Back to SHEOUT
      </Link>
      <div style={{ margin: '14px 0 16px' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: 0 }}>Your Cart</h1>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      {ready && items.length === 0 && <p style={{ color: theme.muted }}>Your cart is empty.</p>}

      {storeIds.map((sid) => {
        const g = groups[sid];
        const subtotal = g.items.reduce((sum, i) => sum + i.price * i.qty, 0);
        return (
          <section
            key={sid}
            style={{
              background: theme.card,
              border: `1px solid ${theme.line}`,
              borderRadius: theme.radius,
              boxShadow: theme.shadow,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontFamily: theme.serif, fontSize: 18, margin: '0 0 8px' }}>{g.storeName}</h3>
            {g.items.map((i) => (
              <div key={i.key} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: `1px solid ${theme.line}` }}>
                <img
                  src={i.image || ''}
                  alt={i.name}
                  style={{ width: 76, height: 92, objectFit: 'cover', borderRadius: 12, background: theme.goldSoft }}
                />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{i.name}</b>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    {[i.size, i.color].filter(Boolean).join(' / ')}
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>{money(i.price)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
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
            <div style={{ textAlign: 'right', marginTop: 8, fontSize: 14 }}>
              Store subtotal: <b style={{ color: theme.gold }}>{money(subtotal)}</b>
            </div>
          </section>
        );
      })}

      {items.length > 0 && (
        <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
            <b style={{ fontFamily: theme.serif }}>Total</b>
            <b>{money(total)}</b>
          </div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
            {storeIds.length} {storeIds.length === 1 ? 'store' : 'stores'} in this order · delivery fee added at checkout
          </div>
          <Link
            href="/checkout"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: 14,
              padding: 16,
              borderRadius: 999,
              background: theme.ink,
              color: theme.gold,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: 0.5,
              textDecoration: 'none',
            }}
          >
            Checkout
          </Link>
        </div>
      )}
    </main>
  );
}
