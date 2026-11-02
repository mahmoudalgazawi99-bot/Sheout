import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import CartLink from '@/components/CartLink';
import { theme } from '@/lib/theme';

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
    background: theme.card,
    borderRadius: theme.radius,
    overflow: 'hidden',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.line}`,
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  };
  const img = {
    width: '100%',
    objectFit: 'cover',
    background: theme.goldSoft,
    display: 'block',
  };

  const title = category ? category : q ? `Results for "${q}"` : 'All products';

  const heading = (text, size) => (
    <div style={{ margin: '22px 0 12px' }}>
      <h2 style={{ fontFamily: theme.serif, fontSize: size, fontWeight: 600, margin: 0 }}>{text}</h2>
      <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
    </div>
  );

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
          ← Back to SHEOUT
        </Link>
        <CartLink />
      </div>

      <form action="/search" method="GET" style={{ marginTop: 14 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products, stores..."
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: 999,
            border: `1px solid ${theme.line}`,
            background: theme.card,
            boxShadow: theme.shadow,
            fontSize: 16,
            outline: 'none',
          }}
        />
      </form>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 0 4px' }}>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/search?category=${c}`}
            style={{
              background: c === category ? theme.ink : theme.card,
              color: c === category ? theme.gold : theme.ink,
              border: `1px solid ${c === category ? theme.ink : theme.line}`,
              padding: '9px 18px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
          >
            {c}
          </Link>
        ))}
      </div>

      {heading(title, 24)}

      {stores.length > 0 && (
        <>
          <h3 style={{ fontFamily: theme.serif, margin: '0 0 10px' }}>Stores</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {stores.map((s) => (
              <Link key={s.id} href={`/stores/${s.id}`} style={card}>
                <img src={s.logo_url || s.cover_url || ''} alt={s.name} style={{ ...img, aspectRatio: '1 / 1' }} />
                <div style={{ padding: '12px 14px' }}>
                  <b style={{ fontFamily: theme.serif, fontSize: 16 }}>{s.name}</b>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{s.location}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontFamily: theme.serif, margin: '22px 0 10px' }}>Products ({products.length})</h3>
      {products.length === 0 && stores.length === 0 && (
        <p style={{ color: theme.muted }}>No results found. Try a different search or category.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} style={card}>
            <img src={firstImage(p.images) || ''} alt={p.name} style={{ ...img, aspectRatio: '4 / 5' }} />
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                {p.stores?.name}
              </div>
              <b style={{ fontSize: 14, display: 'block', marginTop: 2 }}>{p.name}</b>
              <div style={{ marginTop: 6 }}>
                {p.sale_price ? (
                  <>
                    <b style={{ color: theme.gold }}>{money(p.sale_price)}</b>{' '}
                    <s style={{ color: theme.muted, fontSize: 12 }}>{money(p.price)}</s>
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
