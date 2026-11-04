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

export default async function SearchPage({ searchParams }) {
  const lang = await getLang();
  const sp = await searchParams;
  const rawQ = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const rawCat = Array.isArray(sp?.category) ? sp.category[0] : sp?.category;

  const q = String(rawQ || '').trim().slice(0, 50);
  const category = CATEGORIES.includes(rawCat) ? rawCat : '';
  const pattern = `%${q.replace(/[%_\\,()]/g, ' ')}%`;

  let productsQuery = supabase
    .from('products')
    .select('id, name, name_ar, price, sale_price, images, stores(name, name_ar)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40);
  if (category) productsQuery = productsQuery.eq('category', category);
  if (q) productsQuery = productsQuery.or(`name.ilike.${pattern},name_ar.ilike.${pattern}`);

  let stores = [];
  if (q && !category) {
    const { data } = await supabase
      .from('stores')
      .select('id, name, name_ar, logo_url, cover_url, location, location_ar')
      .or(`name.ilike.${pattern},name_ar.ilike.${pattern}`)
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

  const title = category
    ? t(lang, category)
    : q
      ? `${t(lang, 'resultsFor')} "${q}"`
      : t(lang, 'allProducts');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
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

      <form action="/search" method="GET" style={{ marginTop: 14 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder={t(lang, 'search')}
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
            {t(lang, c)}
          </Link>
        ))}
      </div>

      <div style={{ margin: '22px 0 12px' }}>
        <h2 style={{ fontFamily: theme.serif, fontSize: 24, fontWeight: 600, margin: 0 }}>{title}</h2>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      {stores.length > 0 && (
        <>
          <h3 style={{ fontFamily: theme.serif, margin: '0 0 10px' }}>{t(lang, 'stores')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {stores.map((s) => (
              <Link key={s.id} href={`/stores/${s.id}`} style={card}>
                <img src={s.logo_url || s.cover_url || ''} alt={pick(lang, s.name, s.name_ar)} style={{ ...img, aspectRatio: '1 / 1' }} />
                <div style={{ padding: '12px 14px' }}>
                  <b style={{ fontFamily: theme.serif, fontSize: 16 }}>{pick(lang, s.name, s.name_ar)}</b>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                    {pick(lang, s.location, s.location_ar)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontFamily: theme.serif, margin: '22px 0 10px' }}>
        {t(lang, 'products')} ({products.length})
      </h3>
      {products.length === 0 && stores.length === 0 && (
        <p style={{ color: theme.muted }}>{t(lang, 'noResults')}</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} style={card}>
            <img src={firstImage(p.images) || ''} alt={pick(lang, p.name, p.name_ar)} style={{ ...img, aspectRatio: '4 / 5' }} />
            <div style={{ padding: '12px 14px' }}>
              <div
                style={{
                  fontSize: 11,
                  color: theme.muted,
                  textTransform: lang === 'en' ? 'uppercase' : 'none',
                  letterSpacing: lang === 'en' ? 1 : 0,
                }}
              >
                {p.stores ? pick(lang, p.stores.name, p.stores.name_ar) : ''}
              </div>
              <b style={{ fontSize: 14, display: 'block', marginTop: 2 }}>{pick(lang, p.name, p.name_ar)}</b>
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
    </main>
  );
}
