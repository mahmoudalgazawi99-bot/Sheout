import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AddToCart from '@/components/AddToCart';
import CartLink from '@/components/CartLink';
import LangToggle from '@/components/LangToggle';
import ProductGallery from '@/components/ProductGallery';
import SizeGuide from '@/components/sizeguide';
import { getLang } from '@/lib/serverlang';
import { t, money, pick } from '@/lib/i18n';
import { toDate } from '@/lib/analytics';
import { stars } from '@/lib/feedback';
import { SITE_URL } from '@/lib/site';
import { FREE_DELIVERY_FROM } from '@/lib/shipping';
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

export async function generateMetadata({ params }) {
  const { id } = await params;
  const lang = await getLang();
  const { data: p } = await supabase
    .from('products')
    .select('id, name, name_ar, description, price, sale_price, images, status')
    .eq('id', id)
    .maybeSingle();

  if (!p || p.status !== 'active') return { title: 'SHEOUT' };

  const name = pick(lang, p.name, p.name_ar);
  const img = toImageList(p.images)[0];
  const desc = [
    money(lang, p.sale_price || p.price),
    p.description ? String(p.description).slice(0, 120) : lang === 'ar' ? 'أزياء عصرية من الأردن' : 'Modern fashion from Jordan',
  ].join(' · ');
  const title = `${name} | SHEOUT`;
  const url = `${SITE_URL}/products/${p.id}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: 'SHEOUT',
      type: 'website',
      locale: lang === 'ar' ? 'ar_JO' : 'en_US',
      images: img ? [{ url: img, alt: name }] : [],
    },
    twitter: {
      card: img ? 'summary_large_image' : 'summary',
      title,
      description: desc,
      images: img ? [img] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const lang = await getLang();
  const ar = lang === 'ar';
  const { id } = await params;

  const { data: product } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

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

  let variants = [];
  try {
    const { data: vr } = await supabaseAdmin
      .from('product_variants')
      .select('size, color, quantity')
      .eq('product_id', id);
    variants = (vr ?? []).map((v) => ({
      size: v.size || '',
      color: v.color || '',
      quantity: Number(v.quantity) || 0,
    }));
  } catch {}

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

      <ProductGallery images={images} video={product.video_url || ''} alt={productName} />

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

      <div
        style={{
          marginTop: 10,
          display: 'inline-block',
          background: theme.goldSoft,
          borderRadius: 999,
          padding: '6px 14px',
          fontSize: 13,
        }}
      >
        🚚{' '}
        {ar
          ? `توصيل مجاني للطلبات فوق ${money(lang, FREE_DELIVERY_FROM)}`
          : `Free delivery on orders over ${money(lang, FREE_DELIVERY_FROM)}`}
      </div>

      {product.description && (
        <p style={{ lineHeight: 1.7, color: '#3a362f', marginTop: 14 }}>{product.description}</p>
      )}

      <SizeGuide guide={product.size_guide} modelInfo={product.model_info} lang={lang} />

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
        variants={variants}
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
