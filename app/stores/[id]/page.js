import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import CartLink from '@/components/CartLink';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

function firstImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && first.url) return String(first.url);
  return null;
}

const money = (v) => `${Number(v).toFixed(2)} JD`;

export default async function StorePage({ params }) {
  const { id } = await params;

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, logo_url, cover_url, description, location, phone, working_hours')
    .eq('id', id)
    .maybeSingle();

  const topBar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        ← Back to SHEOUT
      </Link>
      <CartLink />
    </div>
  );

  if (!store) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
        {topBar}
        <h2 style={{ fontFamily: theme.serif }}>Store not found</h2>
      </main>
    );
  }

  const { data: productsData } = await supabase
    .from('products')
    .select('id, name, price, sale_price, images')
    .eq('store_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

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
    aspectRatio: '4 / 5',
    objectFit: 'cover',
    background: theme.goldSoft,
    display: 'block',
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      {topBar}

      <img
        src={store.cover_url || ''}
        alt={store.name}
        style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: theme.radius, background: theme.goldSoft, display: 'block', marginTop: 14, boxShadow: theme.shadow }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
        {store.logo_url && (
          <img
            src={store.logo_url}
            alt=""
            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', background: theme.goldSoft, border: `2px solid ${theme.gold}` }}
          />
        )}
        <div>
          <h1 style={{ fontFamily: theme.serif, fontSize: 26, fontWeight: 600, margin: 0 }}>{store.name}</h1>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>{store.location}</div>
        </div>
      </div>

      {store.description && <p style={{ lineHeight: 1.7, color: '#3a362f' }}>{store.description}</p>}

      {(store.working_hours || store.phone) && (
        <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.9, background: theme.goldSoft, borderRadius: 12, padding: '10px 14px' }}>
          {store.working_hours && <div>Hours: {store.working_hours}</div>}
          {store.phone && <div>Phone: {store.phone}</div>}
        </div>
      )}

      <div style={{ margin: '26px 0 14px' }}>
        <h2 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 600, margin: 0 }}>Products ({products.length})</h2>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>
      {products.length === 0 && <p style={{ color: theme.muted }}>No products yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} style={card}>
            <img src={firstImage(p.images) || ''} alt={p.name} style={img} />
            <div style={{ padding: '12px 14px' }}>
              <b style={{ fontSize: 14 }}>{p.name}</b>
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
