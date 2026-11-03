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
      style={{
        background: theme.ink,
        color: theme.gold,
        padding: '9px 16px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: lang === 'en' ? 0.5 : 0,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {t(lang, 'cart')} ({count})
    </Link>
  );
}
