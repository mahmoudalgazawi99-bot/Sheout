'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';
import { theme } from '@/lib/theme';
import { useLang } from '@/components/LangProvider';
import { t, sizeLabel, colorLabel } from '@/lib/i18n';

export default function AddToCart({ product, sizes, colors }) {
  const lang = useLang();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);

  const inStock = Number(product.quantity) > 0;

  const chip = (active) => ({
    border: active ? `2px solid ${theme.ink}` : `1px solid ${theme.line}`,
    borderRadius: 999,
    padding: active ? '7px 15px' : '8px 16px',
    fontSize: 13,
    background: active ? theme.ink : theme.card,
    color: active ? theme.bg : theme.ink,
    cursor: 'pointer',
  });

  const label = { fontFamily: theme.serif, fontSize: 16, fontWeight: 600 };

  function handleAdd() {
    if (sizes.length > 0 && !size) {
      setMessage(t(lang, 'chooseSize'));
      return;
    }
    if (colors.length > 0 && !color) {
      setMessage(t(lang, 'chooseColor'));
      return;
    }
    addToCart({
      productId: product.id,
      storeId: product.storeId,
      storeName: product.storeName,
      storeNameAr: product.storeNameAr || '',
      name: product.name,
      nameAr: product.nameAr || '',
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
        <div style={{ marginTop: 16 }}>
          <div style={label}>{t(lang, 'sizes')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {sizes.map((s) => (
              <button key={s} type="button" onClick={() => { setSize(s); setAdded(false); }} style={chip(size === s)}>
                {sizeLabel(lang, s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={label}>{t(lang, 'colors')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {colors.map((c) => (
              <button key={c} type="button" onClick={() => { setColor(c); setAdded(false); }} style={chip(color === c)}>
                {colorLabel(lang, c)}
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
          marginTop: 20,
          padding: 16,
          borderRadius: 999,
          border: 'none',
          background: inStock ? theme.ink : '#bbb',
          color: inStock ? theme.gold : '#fff',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: lang === 'en' ? 0.5 : 0,
        }}
      >
        {inStock ? t(lang, 'addToCart') : t(lang, 'outOfStock')}
      </button>

      {added && (
        <p style={{ fontSize: 14 }}>
          {t(lang, 'addedToCart')}{' '}
          <Link href="/cart" style={{ color: theme.gold, fontWeight: 600 }}>{t(lang, 'viewCart')}</Link>
        </p>
      )}
    </div>
  );
}
