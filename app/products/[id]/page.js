import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import AddToCart from '@/components/AddToCart';
import CartLink from '@/components/CartLink';

export const dynamic = 'force-dynamic';

function toImageList(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((i) => (typeof i === 'string' ? i : i && i.url ? String(i.url) : null))
    .filter(Boolean);
}

function toList(v) {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : x && (x.name || x.label || x.value) ? String(x.name || x.label || x.value) : String(x)));
  return [];
}

const money = (v) => `${Number(v).toFixed(2)} JD`;

export default async function ProductPage({ params }) {
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('id, store_id, name, description, category, price, sale_price, sizes, colors, quantity, images, status, stores(id, name)')
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' };
  const topBar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href="/" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        ← Back to SHEOUT
      </Link>
      <CartLink />
    </div>
  );

  if (!product || product.status !== 'active') {
    return (
      <main style={wrap}>
        {topBar}
        <h2>Product not found</h2>
      </main>
    );
  }

  const images = toImageList(product.images);
  const sizes = toList(product.sizes);
  const colors = toList(product.colors);
  const inStock = Number(product.quantity) > 0;
  const effectivePrice = product.sale_price || product.price;

  return (
    <main style={wrap}>
      {topBar}

      <img
        src={images[0] || ''}
        alt={product.name}
        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 12, background: '#f3f3f3', display: 'block', marginTop: 12 }}
      />

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8 }}>
          {images.map((u, i) => (
            <img key={i} src={u} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, background: '#f3f3f3', flex: '0 0 auto' }} />
          ))}
        </div>
      )}

      {product.stores && (
        <div style={{ marginTop: 16, fontSize: 13 }}>
          <Link href={`/stores/${product.stores.id}`} style={{ color: '#777', textDecoration: 'none' }}>
            {product.stores.name}
          </Link>
        </div>
      )}

      <h1 style={{ margin: '4px 0 8px' }}>{product.name}</h1>

      <div style={{ fontSize: 20 }}>
        {product.sale_price ? (
          <>
            <b>{money(product.sale_price)}</b>{' '}
            <s style={{ color: '#999', fontSize: 14 }}>{money(product.price)}</s>
          </>
        ) : (
          <b>{money(product.price)}</b>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color: inStock ? '#177a3c' : '#b00' }}>
        {inStock ? 'In stock' : 'Out of stock'}
      </div>

      {product.description && <p style={{ lineHeight: 1.6 }}>{product.description}</p>}

      <AddToCart
        product={{
          id: product.id,
          name: product.name,
          price: effectivePrice,
          image: images[0] || '',
          storeId: product.stores ? product.stores.id : product.store_id,
          storeName: product.stores ? product.stores.name : '',
          quantity: product.quantity,
        }}
        sizes={sizes}
        colors={colors}
      />
    </main>
  );
}
