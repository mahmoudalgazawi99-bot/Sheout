import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { normalizePhone } from '@/lib/phone';
import { money } from '@/lib/i18n';
import { tagLabel, typeLabel, complaintStatusLabel } from '@/lib/feedback';
import { waLink, ago, dateAr } from '@/lib/contact';
import { Card } from '@/components/analyticsparts';
import { AddNoteForm, NoteDelete } from '@/components/adminfeedbackactions';

export const dynamic = 'force-dynamic';

const jd = (v) => money('ar', v);
const STATUS_AR = { new: 'جديد', processing: 'قيد التنفيذ', delivered: 'تم التوصيل', cancelled: 'ملغي' };

const box = { border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12, background: '#fff' };
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

export default async function AdminCustomersPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const id = String((Array.isArray(sp?.id) ? sp.id[0] : sp?.id) || '');
  const rawQ = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const q = String(rawQ || '').replace(/[%_\\,()]/g, '').trim().slice(0, 40);

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' };

  if (id) {
    const { data: c } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone, member_no, phone_norm, created_at')
      .eq('id', id)
      .maybeSingle();

    if (!c) {
      return (
        <main dir="rtl" lang="ar" style={wrap}>
          <Link href="/admin/customers" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
            → العملاء
          </Link>
          <h2>الزبون غير موجود</h2>
        </main>
      );
    }

    let ids = [c.id];
    if (c.phone_norm) {
      const { data: same } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('phone_norm', c.phone_norm)
        .limit(100);
      ids = (same ?? []).map((x) => x.id);
      if (!ids.includes(c.id)) ids.push(c.id);
    }

    const [ordersRes, notesRes, complaintsRes, reviewsRes] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('id, order_no, total, status, created_at')
        .in('customer_id', ids)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('customer_notes')
        .select('id, tags, note, author_type, author_name, created_at')
        .in('customer_id', ids)
        .order('created_at', { ascending: false })
        .limit(30),
      supabaseAdmin
        .from('complaints')
        .select('id, type, status, created_at, orders(id, order_no)')
        .in('customer_id', ids)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin.from('product_reviews').select('id', { count: 'exact', head: true }).in('customer_id', ids),
    ]);

    const orders = ordersRes.data ?? [];
    const notes = notesRes.data ?? [];
    const complaints = complaintsRes.data ?? [];
    const reviewsCount = reviewsRes.count || 0;

    const valid = orders.filter((o) => o.status !== 'cancelled');
    const spent = valid.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const avg = valid.length ? spent / valid.length : 0;
    const wa = c.phone ? waLink(c.phone) : '';

    return (
      <main dir="rtl" lang="ar" style={wrap}>
        <Link href="/admin/customers" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
          → العملاء
        </Link>
        <h1 style={{ marginBottom: 4 }}>{c.name}</h1>
        <div style={{ fontSize: 14, color: '#555' }}>
          <bdi dir="ltr">{c.phone}</bdi> · رقم العضوية <bdi dir="ltr">{c.member_no}</bdi> · عضو من {dateAr(c.created_at)}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
          {c.phone ? (
            <a href={`tel:${c.phone}`} style={pill}>
              اتصال
            </a>
          ) : null}
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" style={pill}>
              واتساب
            </a>
          ) : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <Card label="الطلبات" value={valid.length} sub="غير الملغية" />
          <Card label="مجموع المشتريات" value={jd(spent)} />
          <Card label="متوسط الطلب" value={jd(avg)} />
          <Card label="آخر طلب" value={orders[0] ? dateAr(orders[0].created_at) : '—'} />
          <Card label="الشكاوى" value={complaints.length} />
          <Card label="التقييمات" value={reviewsCount} />
        </div>

        <h2 style={{ fontSize: 18, margin: '24px 0 10px' }}>ملاحظات عن الزبون</h2>
        <div style={box}>
          {notes.length === 0 && <div style={{ color: '#777', fontSize: 14 }}>ما في ملاحظات لسا.</div>}
          {notes.map((n, i) => (
            <div key={n.id} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid #f1f1f1' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(n.tags ?? []).map((t) => (
                  <span key={t} style={{ background: '#f6f1e4', borderRadius: 999, padding: '3px 10px', fontSize: 13 }}>
                    {tagLabel(t)}
                  </span>
                ))}
              </div>
              {n.note ? <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.7 }}>{n.note}</div> : null}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#777' }}>
                <span>
                  {n.author_type === 'courier' ? 'المندوب' : 'الأدمن'}: {n.author_name} · {ago(n.created_at)}
                </span>
                <NoteDelete id={n.id} />
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 15, margin: '14px 0 8px' }}>إضافة ملاحظة</h3>
        <div style={box}>
          <AddNoteForm customerId={c.id} />
        </div>

        {complaints.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, margin: '24px 0 10px' }}>الشكاوى</h2>
            <div style={box}>
              {complaints.map((x, i) => (
                <div
                  key={x.id}
                  style={{
                    padding: '8px 0',
                    borderTop: i === 0 ? 'none' : '1px solid #f1f1f1',
                    fontSize: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span>
                    {typeLabel(x.type, 'ar')}
                    {x.orders ? (
                      <Link href={`/admin/orders/${x.orders.id}`} style={{ color: '#555', fontSize: 12 }}>
                        {' '}
                        · <bdi dir="ltr">#{x.orders.order_no || String(x.orders.id).slice(0, 8).toUpperCase()}</bdi>
                      </Link>
                    ) : null}
                  </span>
                  <span style={{ color: '#777', fontSize: 12 }}>{complaintStatusLabel(x.status, 'ar')}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 style={{ fontSize: 18, margin: '24px 0 10px' }}>الطلبات ({orders.length})</h2>
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            style={{ ...box, display: 'flex', justifyContent: 'space-between', gap: 8, textDecoration: 'none', color: 'inherit' }}
          >
            <span>
              <bdi dir="ltr">#{o.order_no || String(o.id).slice(0, 8).toUpperCase()}</bdi>
              <span style={{ color: '#777', fontSize: 12 }}> · {dateAr(o.created_at)}</span>
            </span>
            <span>
              <b>{jd(o.total)}</b>
              <span style={{ color: '#777', fontSize: 12 }}> · {STATUS_AR[o.status] || o.status}</span>
            </span>
          </Link>
        ))}
      </main>
    );
  }

  let query = supabaseAdmin
    .from('customers')
    .select('id, name, phone, member_no, phone_norm, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (q) {
    const pn = normalizePhone(q);
    const parts = [`name.ilike.%${q}%`];
    if (pn.length >= 3) parts.push(`phone_norm.ilike.%${pn}%`);
    if (/^\d{4,6}$/.test(q)) parts.push(`member_no.eq.${q}`);
    query = query.or(parts.join(','));
  }

  const { data: list } = await query;
  const customers = list ?? [];

  return (
    <main dir="rtl" lang="ar" style={wrap}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>العملاء</h1>

      <form method="GET" style={{ display: 'flex', gap: 8 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="اسم أو هاتف أو رقم عضوية"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 999, border: '1px solid #ddd', fontSize: 15, minWidth: 0 }}
        />
        <button
          type="submit"
          style={{ padding: '10px 18px', borderRadius: 999, border: 'none', background: '#111', color: '#fff', fontWeight: 600 }}
        >
          بحث
        </button>
      </form>

      <div style={{ fontSize: 12, color: '#777', margin: '8px 0 12px' }}>
        {q ? `نتائج البحث (${customers.length})` : 'آخر العملاء'}
      </div>

      {customers.length === 0 && <p style={{ color: '#777' }}>ما في نتائج.</p>}
      {customers.map((c) => (
        <Link
          key={c.id}
          href={`/admin/customers?id=${c.id}`}
          style={{ ...box, display: 'block', textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>{c.name}</b>
            <span style={{ color: '#777', fontSize: 13 }}>
              عضو <bdi dir="ltr">{c.member_no}</bdi>
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
            <bdi dir="ltr">{c.phone}</bdi> · {dateAr(c.created_at)}
          </div>
        </Link>
      ))}
    </main>
  );
}
