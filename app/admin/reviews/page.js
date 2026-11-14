import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { stars } from '@/lib/feedback';
import { ago } from '@/lib/contact';
import { ReviewToggle } from '@/components/adminfeedbackactions';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  let list = [];
  let loadError = false;
  try {
    const { data, error } = await supabaseAdmin
      .from('product_reviews')
      .select('id, rating, comment, display_name, status, created_at, products(name, name_ar, product_no), orders(id, order_no)')
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) loadError = true;
    else list = data ?? [];
  } catch {
    loadError = true;
  }

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>تعليقات المنتجات</h1>

      {loadError && <p style={{ color: '#b00' }}>تعذّر التحميل. تأكد إنو جدول product_reviews موجود بالقاعدة.</p>}
      {!loadError && list.length === 0 && <p style={{ color: '#777' }}>ما في تعليقات لسا.</p>}

      {list.map((r) => {
        const p = r.products || {};
        const ord = r.orders || {};
        const orderNo = ord.order_no || (ord.id ? String(ord.id).slice(0, 8).toUpperCase() : '');
        const visible = r.status === 'visible';
        return (
          <div
            key={r.id}
            style={{
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              background: visible ? '#fff' : '#f6f6f6',
              opacity: visible ? 1 : 0.8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b>
                {p.name_ar || p.name}
                {p.product_no ? <span style={{ color: '#777', fontSize: 12 }}> · رقم {p.product_no}</span> : null}
              </b>
              <span style={{ fontSize: 12, color: '#777' }}>{ago(r.created_at)}</span>
            </div>
            <div style={{ color: '#b8924a', fontSize: 20, marginTop: 4 }}>{stars(r.rating)}</div>
            {r.comment ? <div style={{ marginTop: 4, fontSize: 15, lineHeight: 1.7 }}>{r.comment}</div> : null}
            <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>
              {r.display_name}
              {ord.id ? (
                <>
                  {' · '}
                  <Link href={`/admin/orders/${ord.id}`} style={{ color: '#555' }}>
                    طلب <bdi dir="ltr">#{orderNo}</bdi>
                  </Link>
                </>
              ) : null}
              {!visible ? ' · مخفي' : ''}
            </div>
            <ReviewToggle id={r.id} visible={visible} />
          </div>
        );
      })}
    </main>
  );
}
