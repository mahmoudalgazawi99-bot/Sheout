'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';
import { theme } from '@/lib/theme';
import { useLang } from '@/components/LangProvider';
import { t, sizeLabel, colorLabel } from '@/lib/i18n';

export default function AddToCart({ product, sizes, colors, variants = [] }) {
  const lang = useLang();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);

  const hasVariants = variants.length > 0;
  const inStock = Number(product.quantity) > 0;

  const qtyOf = (s, c) => {
    const v = variants.find((x) => x.size === (s || '') && x.color === (c || ''));
    return v ? v.quantity : 0;
  };

  const sizeOk = (s) => {
    if (!hasVariants) return true;
    if (colors.length > 0) {
      return color ? qtyOf(s, color) > 0 : variants.some((v) => v.size === s && v.quantity > 0);
    }
    return qtyOf(s, '') > 0;
  };

  const colorOk = (c) => {
    if (!hasVariants) return true;
    if (sizes.length > 0) {
      return size ? qtyOf(size, c) > 0 : variants.some((v) => v.color === c && v.quantity > 0);
    }
    return qtyOf('', c) > 0;
  };

  const chip = (active, disabled) => ({
    border: active ? `2px solid ${theme.ink}` : `1px solid ${theme.line}`,
    borderRadius: 999,
    padding: active ? '7px 15px' : '8px 16px',
    fontSize: 13,
    background: active ? theme.ink : theme.card,
    color: active ? theme.bg : theme.ink,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    textDecoration: disabled ? 'line-through' : 'none',
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
    const maxQty = hasVariants ? qtyOf(size, color) : Number(product.quantity) || 99;
    if (maxQty <= 0) {
      setMessage(t(lang, 'outOfStock'));
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr || '',
      image: product.image,
      price: Number(product.price),
      size,
      color,
      qty: 1,
      maxQty,
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
            {sizes.map((s) => {
              const ok = sizeOk(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  title={ok ? undefined : lang === 'ar' ? 'نفد' : 'Sold out'}
                  onClick={() => {
                    setSize(s);
                    setAdded(false);
                  }}
                  style={chip(size === s, !ok)}
                >
                  {sizeLabel(lang, s)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={label}>{t(lang, 'colors')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {colors.map((c) => {
              const ok = colorOk(c);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!ok}
                  title={ok ? undefined : lang === 'ar' ? 'نفد' : 'Sold out'}
                  onClick={() => {
                    setColor(c);
                    setAdded(false);
                  }}
                  style={chip(color === c, !ok)}
                >
                  {colorLabel(lang, c)}
                </button>
              );
            })}
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
          <Link href="/cart" style={{ color: theme.gold, fontWeight: 600 }}>
            {t(lang, 'viewCart')}
          </Link>
        </p>
      )}
    </div>
  );
}
