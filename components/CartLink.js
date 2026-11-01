'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/cart';

export default function CartLink() {
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
      style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 20, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
    >
      Cart ({count})
    </Link>
  );
}
