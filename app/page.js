import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import CartLink from '@/components/CartLink';
import LangToggle from '@/components/LangToggle';
import { getLang } from '@/lib/serverlang';
import { t, money, pick } from '@/lib/i18n';
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

function SectionTitle({ children }) {
  return (
    <div style={{ margin: '28px 0 14px' }}>
      <h2 style={{ fontFamily: theme.serif, fontSize: 24, fontWeight: 600, margin: 0 }}>{children}</h2>
      <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
    </div>
  );
}

function ProductGrid({ products, lang }) {
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
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {products.map((p) => (
        <Link key={p.id} href={`/products/${p.id}`} style={card}>
          <img
            src={firstImage(p.images) || ''}
            alt={pick(lang, p.name, p.name_ar)}
            style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', background: theme.goldSoft, display: 'block' }}
          />
          <div style={{ padding: '12px 14px' }}>
            <b style={{ fontSize: 14, display: 'block' }}>{pick(lang, p.name, p.name_ar)}</b>
            <div style={{ marginTop: 6 }}>
              {p.sale_price ? (
                <>
                  <b style={{ color: theme.gold }}>{money(lang, p.sale_price)}</b>{' '}
                  <s style={{ color: theme.muted, fontSize: 12 }}>{money(lang, p.price)}</s>
                </>
              ) : (
                <b>{money(lang, p.price)}</b>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function Home() {
  const lang = await getLang();

  const [newRes, offersRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, name_ar, price, sale_price, images')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('products')
      .select('id, name, name_ar, price, sale_price, images')
      .eq('status', 'active')
      .not('sale_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const newProducts = newRes.data ?? [];
  const offers = offersRes.data ?? [];
  const hasError = newRes.error || offersRes.error;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 4px' }}>
        <div>
          <h1 style={{ fontFamily: theme.serif, letterSpacing: 6, fontSize: 30, margin: 0, fontWeight: 600 }}>SHEOUT</h1>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
            {lang === 'ar' ? 'أزياء عصرية من الأردن' : 'Modern fashion from Jordan'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LangToggle />
          <CartLink />
        </div>
      </div>

      <form action="/search" method="GET" style={{ marginTop: 16 }}>
        <input
          name="q"
          placeholder={lang === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
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
            {t(lang, c)}
          </Link>
        ))}
      </div>

      {hasError && <p style={{ color: '#b00' }}>{t(lang, 'loadError')}</p>}

      <SectionTitle>{t(lang, 'newArrivals')}</SectionTitle>
      <ProductGrid products={newProducts} lang={lang} />

      {offers.length > 0 && (
        <>
          <SectionTitle>{lang === 'ar' ? 'عروض خاصة' : 'Special Offers'}</SectionTitle>
          <ProductGrid products={offers} lang={lang} />
        </>
      )}
    </main>
  );
}
