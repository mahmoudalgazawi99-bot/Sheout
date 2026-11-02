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

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const rawQ = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const rawCat = Array.isArray(sp?.category) ? sp.category[0] : sp?.category;

  const q = String(rawQ || '').trim().slice(0, 50);
  const category = CATEGORIES.includes(rawCat) ? rawCat : '';
  const pattern = `%${q.replace(/[%_\\]/g, ' ')}%`;

  let productsQuery = supabase
    .from('products')
    .select('id, name, price, sale_price, images, stores(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40);
  if (category) productsQuery = productsQuery.eq('category', category);
  if (q) productsQuery = productsQuery.ilike('name', pattern);

  let stores = [];
  if (q && !category) {
    const { data } = await supabase
      .from('stores')
      .select('id, name, logo_url, cover_url, location')
      .ilike('name', pattern)
      .limit(10);
    stores = data ?? [];
  }

  const { data: productsData } = await productsQuery;
  const products = productsData ?? [];

  const card = {
    border: '1px solid #eee',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  };
  const img = {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    background: '#f3f3f3',
    display: 'block',
  };

  const title = category ? category : q ? `Results for "${q}"` : 'All products';

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
          ← Back to SHEOUT
        </Link>
        <CartLink />
      </div>

      <form action="/search" method="GET" style={{ marginTop: 12 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products, stores..."
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', fontSize: 16 }}
        />
      </form>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/search?category=${c}`}
            style={{
              background: c === category ? '#111' : '#fff',
              color: c === category ? '#fff' : '#111',
              border: '1px solid #111',
              padding: '8px 14px',
              borderRadius: 20,
              fontSize: 13,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
          >
            {c}
          </Link>
        ))}
      </div>

      <h2 style={{ marginBottom: 8 }}>{title}</h2>

      {stores.length > 0 && (
        <>
          <h3>Stores</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {stores.map((s) => (
              <Link key={s.id} href={`/stores/${s.id}`} style={card}>
                <img src={s.logo_url || s.cover_url || ''} alt={s.name} style={img} />
                <div style={{ padding: 10 }}>
                  <b>{s.name}</b>
                  <div style={{ fontSize: 12, color: '#777' }}>{s.location}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <h3 style={{ marginTop: 20 }}>Products ({products.length})</h3>
      {products.length === 0 && stores.length === 0 && (
        <p style={{ color: '#777' }}>No results found. Try a different search or category.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} style={card}>
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
