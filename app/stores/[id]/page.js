import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

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

  const backLink = (
    <Link href="/" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
      ← Back to SHEOUT
    </Link>
  );

  if (!store) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
        {backLink}
        <h2>Store not found</h2>
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
    border: '1px solid #eee',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
  };
  const img = {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    background: '#f3f3f3',
    display: 'block',
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      {backLink}

      <img
        src={store.cover_url || ''}
        alt={store.name}
        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, background: '#f3f3f3', display: 'block', marginTop: 12 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        {store.logo_url && (
          <img src={store.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', background: '#f3f3f3' }} />
        )}
        <div>
          <h1 style={{ margin: 0 }}>{store.name}</h1>
          <div style={{ fontSize: 13, color: '#777' }}>{store.location}</div>
        </div>
      </div>

      {store.description && <p style={{ lineHeight: 1.6 }}>{store.description}</p>}

      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
        {store.working_hours && <div>Hours: {store.working_hours}</div>}
        {store.phone && <div>Phone: {store.phone}</div>}
      </div>

      <h2 style={{ marginTop: 24 }}>Products ({products.length})</h2>
      {products.length === 0 && <p style={{ color: '#777' }}>No products yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {products.map((p) => (
          <div key={p.id} style={card}>
            <img src={firstImage(p.images) || ''} alt={p.name} style={img} />
            <div style={{ padding: 10 }}>
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
          </div>
        ))}
      </div>
    </main>
  );
}
