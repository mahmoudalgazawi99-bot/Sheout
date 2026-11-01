'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';

export default function AddToCart({ product, sizes, colors }) {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);

  const inStock = Number(product.quantity) > 0;

  const chip = (active) => ({
    border: active ? '2px solid #111' : '1px solid #ddd',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 13,
    background: '#fff',
    cursor: 'pointer',
  });

  function handleAdd() {
    if (sizes.length > 0 && !size) {
      setMessage('Please choose a size');
      return;
    }
    if (colors.length > 0 && !color) {
      setMessage('Please choose a color');
      return;
    }
    addToCart({
      productId: product.id,
      storeId: product.storeId,
      storeName: product.storeName,
      name: product.name,
      image: product.image,
      price: Number(product.price),
      size,
      color,
      qty: 1,
      maxQty: Number(product.quantity) || 99,
    });
    setMessage('');
    setAdded(true);
  }

  return (
    <div style={{ marginTop: 12 }}>
      {sizes.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <b>Sizes</b>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {sizes.map((s) => (
              <button key={s} type="button" onClick={() => { setSize(s); setAdded(false); }} style={chip(size === s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <b>Colors</b>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {colors.map((c) => (
              <button key={c} type="button" onClick={() => { setColor(c); setAdded(false); }} style={chip(color === c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {message && <p style={{ color: '#b00', fontSize: 13 }}>{message}</p>}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!inStock}
        style={{
          width: '100%',
          marginTop: 16,
          padding: 14,
          borderRadius: 10,
          border: 'none',
          background: inStock ? '#111' : '#bbb',
          color: '#fff',
          fontSize: 16,
        }}
      >
        {inStock ? 'Add to cart' : 'Out of stock'}
      </button>

      {added && (
        <p style={{ fontSize: 14 }}>
          Added to cart. <Link href="/cart" style={{ color: '#111' }}>View cart</Link>
        </p>
      )}
    </div>
  );
}
