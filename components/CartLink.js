'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/cart';
import { theme } from '@/lib/theme';
import { useLang } from '@/components/LangProvider';
import { t } from '@/lib/i18n';

export default function CartLink() {
  const lang = useLang();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCart().reduce((sum, i) => sum + i.qty, 0));
    update();
    window.addEventListener('cart-updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('cart-updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={t(lang, 'cart')}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: theme.ink,
        color: theme.gold,
        textDecoration: 'none',
        flex: '0 0 auto',
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            insetInlineEnd: -4,
            minWidth: 20,
            height: 20,
            padding: '0 5px',
            borderRadius: 999,
            background: theme.gold,
            color: theme.ink,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: '20px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
