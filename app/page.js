import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import CartLink from '@/components/CartLink';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['Women', 'Men', 'Kids', 'Shoes', 'Sports', 'Accessories'];

function firstImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && first.url) return String(first.url);
  return null;
}

const money = (v) => `${Number(v).toFixed(2)} JD`;

export default async function Home() {
  const [storesRes, productsRes] = await Promise.all([
    supabase
      .from('stores')
      .select('id, name, logo_url, cover_url, location')
      .limit(6),
    supabase
      .from('products')
      .select('id, name, price, sale_price, images, stores(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const stores = storesRes.data ?? [];
  const products = productsRes.data ?? [];
  const hasError = storesRes.error || productsRes.error;

  const card = {
    border: '1px solid #eee',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
  };
  const linkCard = { ...card, textDecoration: 'none', color: 'inherit', display: 'block' };
  const img = {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    background: '#f3f3f3',
    display: 'block',
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px' }}>
        <h1 style={{ letterSpacing: 2, margin: 0 }}>SHEOUT</h1>
        <CartLink />
      </div>
      <input
        placeholder="Search products, stores..."
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
        {CATEGORIES.map((c) => (
          <span key={c} style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 20, fontSize: 13, whiteSpace: 'nowrap' }}>
            {c}
          </span>
        ))}
      </div>

      {hasError && <p style={{ color: '#b00' }}>Could not load some data. Please try again.</p>}

      <h2>Featured Stores</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {stores.map((s) => (
          <Link key={s.id} href={`/stores/${s.id}`} style={linkCard}>
            <img src={s.logo_url || s.cover_url || ''} alt={s.name} style={img} />
            <div style={{ padding: 10 }}>
              <b>{s.name}</b>
              <div style={{ fontSize: 12, color: '#777' }}>{s.location}</div>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: 24 }}>New Arrivals</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} style={linkCard}>
            <img src={firstImage(p.images) || ''} alt={p.name} style={img} />
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 12, color: '#777' }}>{p.stores?.name}</div>
              <b style={{ fontSize: 14 }}>{p.name}</b>
              <div style={{ marginTop: 4 }}>
                {p.sale_price ? (
                  <>
                    <b>{money(p.sale_price)}</b>{' '}
                    <s style={{ color: '#999', fontSize: 12 }}>{money(p.price)}</s>
                  </>
                ) : (
                  <b>{money(p.price)}</b>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
