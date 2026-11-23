import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { money } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const urlsOf = (images) =>
  (Array.isArray(images) ? images : [])
    .map((i) => (typeof i === 'string' ? i : i && i.url ? String(i.url) : null))
    .filter(Boolean);

const chip = (ok) => ({
  fontSize: 12,
  padding: '2px 9px',
  borderRadius: 999,
  background: ok ? '#e8f4ec' : '#fdeeee',
  color: ok ? '#177a3c' : '#b00',
});

export default async function AdminProductsPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const rawQ = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const q = String(rawQ || '').trim().toLowerCase().slice(0, 40);

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, product_no, name, name_ar, price, sale_price, quantity, status, images, size_guide, video_url, stores(name, name_ar)')
    .order('product_no', { ascending: true })
    .limit(300);

  const all = data ?? [];
  const needImages = all.filter((p) => urlsOf(p.images).length < 3).length;
  const noGuide = all.filter((p) => !p.size_guide).length;

  const list = q
    ? all.filter((p) =>
        [p.name, p.name_ar, String(p.product_no || ''), p.stores && p.stores.name, p.stores && p.stores.name_ar]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q))
      )
    : all;

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>المنتجات</h1>

      {error && <p style={{ color: '#b00' }}>تعذّر التحميل. تأكد إنك نفّذت أمر القاعدة (الأعمدة الجديدة).</p>}

      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.9, marginBottom: 10 }}>
        {all.length} منتج · <b style={{ color: needImages ? '#b00' : '#177a3c' }}>{needImages}</b> بأقل من 3 صور ·{' '}
        <b style={{ color: noGuide ? '#b00' : '#177a3c' }}>{noGuide}</b> بدون دليل مقاسات
      </div>

      <form method="GET" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="اسم، رقم منتج، أو محل"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 999, border: '1px solid #ddd', fontSize: 15, minWidth: 0 }}
        />
        <button type="submit" style={{ padding: '10px 18px', borderRadius: 999, border: 'none', background: '#111', color: '#fff', fontWeight: 600 }}>
          بحث
        </button>
      </form>

      {list.map((p) => {
        const imgs = urlsOf(p.images);
        return (
          <Link
            key={p.id}
            href={`/admin/products/${p.id}`}
            style={{
              display: 'flex',
              gap: 12,
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 10,
              marginBottom: 10,
              background: '#fff',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <img src={imgs[0] || ''} alt="" style={{ width: 56, height: 68, objectFit: 'cover', borderRadius: 8, background: '#f3f3f3' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 14 }}>{p.name_ar || p.name}</b>
              <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                رقم {p.product_no} · {p.stores ? p.stores.name_ar || p.stores.name : ''} · {money('ar', p.sale_price || p.price)} ·
                كمية {p.quantity}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <span style={chip(imgs.length >= 3)}>🖼 {imgs.length}</span>
                <span style={chip(!!p.size_guide)}>📏 {p.size_guide ? 'دليل' : 'بدون دليل'}</span>
                <span style={chip(!!p.video_url)}>🎬 {p.video_url ? 'فيديو' : '—'}</span>
              </div>
            </div>
          </Link>
        );
      })}

      {list.length === 0 && !error && <p style={{ color: '#777' }}>ما في نتائج.</p>}
    </main>
  );
}
