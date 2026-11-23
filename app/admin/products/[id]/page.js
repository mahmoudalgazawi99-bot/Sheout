import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import ProductEditor from '@/components/producteditor';

export const dynamic = 'force-dynamic';

const urlsOf = (images) =>
  (Array.isArray(images) ? images : [])
    .map((i) => (typeof i === 'string' ? i : i && i.url ? String(i.url) : null))
    .filter(Boolean);

const listOf = (v) =>
  Array.isArray(v)
    ? v.map((x) => (typeof x === 'string' ? x : x && (x.name || x.label || x.value) ? String(x.name || x.label || x.value) : String(x)))
    : [];

export default async function AdminProductPage({ params }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const { id } = await params;
  const { data: p } = await supabaseAdmin.from('products').select('*, stores(name, name_ar)').eq('id', id).maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' };

  if (!p) {
    return (
      <main dir="rtl" lang="ar" style={wrap}>
        <Link href="/admin/products" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
          → المنتجات
        </Link>
        <h2>المنتج غير موجود</h2>
      </main>
    );
  }

  return (
    <main dir="rtl" lang="ar" style={wrap}>
      <Link href="/admin/products" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → المنتجات
      </Link>
      <h1 style={{ marginBottom: 4 }}>{p.name_ar || p.name}</h1>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 14, lineHeight: 1.8 }}>
        رقم {p.product_no} · {p.stores ? p.stores.name_ar || p.stores.name : ''} ·{' '}
        <Link href={`/products/${p.id}`} style={{ color: '#111' }}>
          فتح صفحة المنتج
        </Link>
      </div>

      <ProductEditor
        product={{
          id: p.id,
          images: urlsOf(p.images),
          video: p.video_url || '',
          guide: p.size_guide || null,
          modelInfo: p.model_info || '',
          sizes: listOf(p.sizes),
        }}
      />
    </main>
  );
}
