import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AddToCart from '@/components/AddToCart';
import CartLink from '@/components/CartLink';
import LangToggle from '@/components/LangToggle';
import { getLang } from '@/lib/serverlang';
import { t, money, pick } from '@/lib/i18n';
import { toDate } from '@/lib/analytics';
import { stars } from '@/lib/feedback';
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
  const ar = lang === 'ar';
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('id, name, name_ar, description, category, price, sale_price, sizes, colors, quantity, images, status')
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16 };
  const topBar = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
        {ar ? '→ ' : '← '}
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

  let reviews = [];
  try {
    const { data: rv } = await supabaseAdmin
      .from('product_reviews')
      .select('rating, comment, display_name, created_at')
      .eq('product_id', id)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .limit(100);
    reviews = rv ?? [];
  } catch {}
  const reviewCount = reviews.length;
  const avg = reviewCount ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10 : 0;

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

      <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: '18px 0 4px' }}>{productName}</h1>

      {reviewCount > 0 && (
        <div style={{ fontSize: 14, marginBottom: 6 }}>
          <span style={{ color: theme.gold }}>★</span> <b>{avg}</b>{' '}
          <span style={{ color: theme.muted }}>
            ({reviewCount} {ar ? 'تقييم' : reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      )}

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
          quantity: product.quantity,
        }}
        sizes={sizes}
        colors={colors}
      />

      <div style={{ margin: '30px 0 12px' }}>
        <h2 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 600, margin: 0 }}>
          {ar ? 'تقييمات العملاء' : 'Customer reviews'}
        </h2>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      {reviewCount === 0 && (
        <p style={{ color: theme.muted, fontSize: 14 }}>
          {ar ? 'ما في تقييمات لسا. التقييم متاح للي استلم المنتج.' : 'No reviews yet. Reviews are open to customers who received this product.'}
        </p>
      )}

      {reviews.slice(0, 10).map((r, i) => {
        const d = toDate(r.created_at);
        return (
          <div
            key={i}
            style={{
              background: theme.card,
              border: `1px solid ${theme.line}`,
              borderRadius: theme.radius,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <b style={{ fontSize: 14 }}>{r.display_name}</b>
              <span style={{ fontSize: 12, color: theme.muted }}>
                {d ? d.toLocaleDateString(ar ? 'ar-JO' : 'en-GB', { timeZone: 'Asia/Amman', dateStyle: 'medium' }) : ''}
              </span>
            </div>
            <div style={{ color: theme.gold, fontSize: 18, marginTop: 2 }}>{stars(r.rating)}</div>
            {r.comment ? <div style={{ fontSize: 14, lineHeight: 1.7, marginTop: 4 }}>{r.comment}</div> : null}
            <div style={{ fontSize: 11, color: '#177a3c', marginTop: 4 }}>
              {ar ? '✓ مشتري موثّق' : '✓ Verified purchase'}
            </div>
          </div>
        );
      })}
    </main>
  );
}
