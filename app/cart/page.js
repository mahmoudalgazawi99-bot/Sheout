'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart, setQty, removeItem } from '@/lib/cart';
import { theme } from '@/lib/theme';
import { useLang } from '@/components/LangProvider';
import LangToggle from '@/components/LangToggle';
import { t, money, pick, sizeLabel, colorLabel, storesLine } from '@/lib/i18n';

export default function CartPage() {
  const lang = useLang();
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
    if (!groups[i.storeId]) {
      groups[i.storeId] = { storeName: i.storeName, storeNameAr: i.storeNameAr, items: [] };
    }
    if (!groups[i.storeId].storeNameAr && i.storeNameAr) groups[i.storeId].storeNameAr = i.storeNameAr;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
          {lang === 'ar' ? '→ ' : '← '}
          {t(lang, 'backTo')}
        </Link>
        <LangToggle />
      </div>
      <div style={{ margin: '14px 0 16px' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: 0 }}>{t(lang, 'yourCart')}</h1>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      {ready && items.length === 0 && <p style={{ color: theme.muted }}>{t(lang, 'cartEmpty')}</p>}

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
            <h3 style={{ fontFamily: theme.serif, fontSize: 18, margin: '0 0 8px' }}>
              {pick(lang, g.storeName, g.storeNameAr)}
            </h3>
            {g.items.map((i) => (
              <div key={i.key} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: `1px solid ${theme.line}` }}>
                <img
                  src={i.image || ''}
                  alt={pick(lang, i.name, i.nameAr)}
                  style={{ width: 76, height: 92, objectFit: 'cover', borderRadius: 12, background: theme.goldSoft }}
                />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{pick(lang, i.name, i.nameAr)}</b>
                  <div style={{ fontSize: 12, color: theme.muted }}>
                    {[i.size ? sizeLabel(lang, i.size) : '', i.color ? colorLabel(lang, i.color) : '']
                      .filter(Boolean)
                      .join(' / ')}
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>{money(lang, i.price)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button type="button" style={qtyBtn} onClick={() => setQty(i.key, i.qty - 1)}>-</button>
                    <span>{i.qty}</span>
                    <button type="button" style={qtyBtn} onClick={() => setQty(i.key, i.qty + 1)}>+</button>
                    <button
                      type="button"
                      onClick={() => removeItem(i.key)}
                      style={{ marginInlineStart: 'auto', border: 'none', background: 'none', color: '#b00', fontSize: 13 }}
                    >
                      {t(lang, 'remove')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'end', marginTop: 8, fontSize: 14 }}>
              {t(lang, 'storeSubtotal')}: <b style={{ color: theme.gold }}>{money(lang, subtotal)}</b>
            </div>
          </section>
        );
      })}

      {items.length > 0 && (
        <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
            <b style={{ fontFamily: theme.serif }}>{t(lang, 'total')}</b>
            <b>{money(lang, total)}</b>
          </div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
            {storesLine(lang, storeIds.length)} · {t(lang, 'deliveryNote')}
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
              letterSpacing: lang === 'en' ? 0.5 : 0,
              textDecoration: 'none',
            }}
          >
            {t(lang, 'checkout')}
          </Link>
        </div>
      )}
    </main>
  );
}
