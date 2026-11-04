import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import AddToCart from '@/components/AddToCart';
import CartLink from '@/components/CartLink';
import LangToggle from '@/components/LangToggle';
import { getLang } from '@/lib/serverlang';
import { t, money, pick } from '@/lib/i18n';
import { theme } from '@/lib/theme';

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

export default async function ProductPage({ params }) {
  const lang = await getLang();
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('id, store_id, name, name_ar, description, category, price, sale_price, sizes, colors, quantity, images, status, stores(id, name, name_ar)')
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16 };
  const topBar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        {lang === 'ar' ? '→ ' : '← '}
        {t(lang, 'backTo')}
      </Link>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <LangToggle />
        <CartLink />
      </div>
    </div>
  );

  if (!product || product.status !== 'active') {
    return (
      <main style={wrap}>
        {topBar}
        <h2 style={{ fontFamily: theme.serif }}>{t(lang, 'productNotFound')}</h2>
      </main>
    );
  }

  const images = toImageList(product.images);
  const sizes = toList(product.sizes);
  const colors = toList(product.colors);
  const inStock = Number(product.quantity) > 0;
  const effectivePrice = product.sale_price || product.price;
  const productName = pick(lang, product.name, product.name_ar);

  return (
    <main style={wrap}>
      {topBar}

      <img
        src={images[0] || ''}
        alt={productName}
        style={{
          width: '100%',
          aspectRatio: '4 / 5',
          objectFit: 'cover',
          borderRadius: theme.radius,
          background: theme.goldSoft,
          display: 'block',
          marginTop: 14,
          boxShadow: theme.shadow,
        }}
      />

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8 }}>
          {images.map((u, i) => (
            <img key={i} src={u} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, background: theme.goldSoft, flex: '0 0 auto' }} />
          ))}
        </div>
      )}

      {product.stores && (
        <div
          style={{
            marginTop: 18,
            fontSize: 12,
            textTransform: lang === 'en' ? 'uppercase' : 'none',
            letterSpacing: lang === 'en' ? 1.5 : 0,
          }}
        >
          <Link href={`/stores/${product.stores.id}`} style={{ color: theme.gold, textDecoration: 'none', fontWeight: 600 }}>
            {pick(lang, product.stores.name, product.stores.name_ar)}
          </Link>
        </div>
      )}

      <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: '4px 0 8px' }}>{productName}</h1>

      <div style={{ fontSize: 22 }}>
        {product.sale_price ? (
          <>
            <b style={{ color: theme.gold }}>{money(lang, product.sale_price)}</b>{' '}
            <s style={{ color: theme.muted, fontSize: 15 }}>{money(lang, product.price)}</s>
          </>
        ) : (
          <b>{money(lang, product.price)}</b>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color: inStock ? '#177a3c' : '#b00' }}>
        {inStock ? t(lang, 'inStock') : t(lang, 'outOfStock')}
      </div>

      {product.description && (
        <p style={{ lineHeight: 1.7, color: '#3a362f', marginTop: 14 }}>{product.description}</p>
      )}

      <AddToCart
        product={{
          id: product.id,
          name: product.name,
          nameAr: product.name_ar || '',
          price: effectivePrice,
          image: images[0] || '',
          storeId: product.stores ? product.stores.id : product.store_id,
          storeName: product.stores ? product.stores.name : '',
          storeNameAr: product.stores ? product.stores.name_ar || '' : '',
          quantity: product.quantity,
        }}
        sizes={sizes}
        colors={colors}
      />
    </main>
  );
}
