import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { fetchAll } from '@/lib/dbpage';
import StockSetupButtons from '@/components/stocksetup';

export const dynamic = 'force-dynamic';

export default async function StockSetupPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const products = await fetchAll(() => supabaseAdmin.from('products').select('id').order('id', { ascending: true }));
  const variants = await fetchAll(() =>
    supabaseAdmin.from('product_variants').select('id, product_id').order('id', { ascending: true })
  );
  const has = new Set(variants.map((v) => v.product_id));
  const remaining = products.filter((p) => !has.has(p.id)).length;

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin/products" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → المنتجات
      </Link>
      <h1>إعداد مخزون المقاسات</h1>

      <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff', lineHeight: 1.9, fontSize: 14 }}>
        <div>
          المنتجات: <b>{products.length}</b>
        </div>
        <div>
          إلها مخزون مقاسات: <b>{products.length - remaining}</b>
        </div>
        <div>
          بدون مخزون مقاسات: <b style={{ color: remaining ? '#b00' : '#177a3c' }}>{remaining}</b>
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#555', lineHeight: 1.9 }}>
        بينشأ صف مخزون لكل مقاس ولون للمنتجات اللي ما إلها. المنتجات اللي إلها مخزون مقاسات ما بيتغيّر عليها شي. وبعدها
        بتعدّل أي منتج من محرر المنتجات (قسم المخزون).
      </p>

      <StockSetupButtons remaining={remaining} />
    </main>
  );
}
