import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { typeLabel, complaintStatusLabel } from '@/lib/feedback';
import { waLink, ago } from '@/lib/contact';
import { ComplaintControls } from '@/components/adminfeedbackactions';

export const dynamic = 'force-dynamic';

const card = { border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12, background: '#fff' };
const pill = {
  display: 'inline-block',
  border: '1px solid #ddd',
  borderRadius: 999,
  padding: '5px 12px',
  fontSize: 13,
  color: '#111',
  textDecoration: 'none',
  background: '#fff',
};

export default async function ComplaintsPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  let list = [];
  let loadError = false;
  try {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(
        'id, type, message, status, admin_reply, created_at, products(name, name_ar, product_no), orders(id, order_no, customers(id, name, phone, member_no))'
      )
      .order('created_at', { ascending: false })
      .limit(80);
    if (error) loadError = true;
    else list = data ?? [];
  } catch {
    loadError = true;
  }

  const active = list.filter((c) => c.status !== 'resolved').reverse();
  const resolved = list.filter((c) => c.status === 'resolved').slice(0, 15);

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>شكاوى العملاء</h1>

      {loadError && <p style={{ color: '#b00' }}>تعذّر تحميل الشكاوى. تأكد إنو جدول complaints موجود بالقاعدة.</p>}
      {!loadError && active.length === 0 && <p style={{ color: '#177a3c' }}>ما في شكاوى مفتوحة.</p>}

      {active.map((c) => {
        const ord = c.orders || {};
        const cust = ord.customers || {};
        const orderNo = ord.order_no || (ord.id ? String(ord.id).slice(0, 8).toUpperCase() : '');
        const wa = cust.phone ? waLink(cust.phone) : '';
        const product = c.products;
        return (
          <div key={c.id} style={{ ...card, borderColor: c.status === 'open' ? '#e2b0b0' : '#eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b style={{ color: '#b00' }}>{typeLabel(c.type, 'ar')}</b>
              <span style={{ fontSize: 12, color: '#777' }}>{ago(c.created_at)}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.7 }}>{c.message}</div>

            <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
              {ord.id ? (
                <Link href={`/admin/orders/${ord.id}`} style={{ color: '#111' }}>
                  طلب <bdi dir="ltr">#{orderNo}</bdi>
                </Link>
              ) : null}
              {product ? ` · ${product.name_ar || product.name}${product.product_no ? ` (رقم ${product.product_no})` : ''}` : ''}
              {` · ${complaintStatusLabel(c.status, 'ar')}`}
            </div>

            <div style={{ marginTop: 8, fontSize: 13 }}>
              {cust.id ? (
                <Link href={`/admin/customers?id=${cust.id}`} style={{ color: '#111' }}>
                  <b>{cust.name}</b>
                </Link>
              ) : (
                <b>{cust.name}</b>
              )}{' '}
              · <bdi dir="ltr">{cust.phone}</bdi>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {cust.phone ? (
                <a href={`tel:${cust.phone}`} style={pill}>
                  اتصال
                </a>
              ) : null}
              {wa ? (
                <a href={wa} target="_blank" rel="noreferrer" style={pill}>
                  واتساب
                </a>
              ) : null}
            </div>

            <ComplaintControls id={c.id} status={c.status} reply={c.admin_reply} />
          </div>
        );
      })}

      {resolved.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>شكاوى محلولة ({resolved.length})</summary>
          <div style={{ marginTop: 10 }}>
            {resolved.map((c) => {
              const ord = c.orders || {};
              const orderNo = ord.order_no || (ord.id ? String(ord.id).slice(0, 8).toUpperCase() : '');
              return (
                <div key={c.id} style={{ ...card, fontSize: 14 }}>
                  <b>{typeLabel(c.type, 'ar')}</b>
                  <div style={{ marginTop: 4, color: '#555' }}>{c.message}</div>
                  {c.admin_reply ? <div style={{ marginTop: 4, color: '#177a3c' }}>ردّك: {c.admin_reply}</div> : null}
                  <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
                    {orderNo ? (
                      <>
                        طلب <bdi dir="ltr">#{orderNo}</bdi> ·{' '}
                      </>
                    ) : null}
                    {ago(c.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </main>
  );
}
