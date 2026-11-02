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

function SectionTitle({ children }) {
  return (
    <div style={{ margin: '28px 0 14px' }}>
      <h2 style={{ fontFamily: theme.serif, fontSize: 24, fontWeight: 600, margin: 0 }}>{children}</h2>
      <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
    </div>
  );
}

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

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 4px' }}>
        <div>
          <h1 style={{ fontFamily: theme.serif, letterSpacing: 6, fontSize: 30, margin: 0, fontWeight: 600 }}>SHEOUT</h1>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Fashion from Jordan's best stores</div>
        </div>
        <CartLink />
      </div>

      <form action="/search" method="GET" style={{ marginTop: 16 }}>
        <input
          name="q"
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
              background: theme.ink,
              color: theme.bg,
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

      {hasError && <p style={{ color: '#b00' }}>Could not load some data. Please try again.</p>}

      <SectionTitle>Featured Stores</SectionTitle>
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

      <SectionTitle>New Arrivals</SectionTitle>
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
