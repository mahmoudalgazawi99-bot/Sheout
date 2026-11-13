import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { toDate, normPhone } from '@/lib/analytics';
import { sizeLabel, colorLabel } from '@/lib/i18n';
import AutoRefresh from '@/components/autorefresh';
import { IssueButtons } from '@/components/issueactions';

export const dynamic = 'force-dynamic';

const REASON_AR = {
  out_of_stock: 'المنتج غير متوفر',
  size_color: 'المقاس أو اللون غير متوفر',
  other: 'سبب آخر',
};

const STATUS_AR = {
  new: 'بانتظار قبول المحل',
  confirmed: 'قيد التجهيز',
  ready: 'جاهز للاستلام',
  picked_up: 'تم استلامه',
  delivered: 'موصّل',
  cancelled: 'ملغي',
};

function waLink(phone) {
  let d = normPhone(phone);
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '962' + d.slice(1);
  return d ? `https://wa.me/${d}` : '';
}

function ago(v) {
  const d = toDate(v);
  if (!d) return '';
  const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  return h < 24 ? `قبل ${h} ساعة` : `قبل ${Math.floor(h / 24)} يوم`;
}

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

export default async function IssuesPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  let issues = [];
  let loadError = false;
  try {
    const { data, error } = await supabaseAdmin
      .from('order_issues')
      .select(
        'id, reason, note, status, created_at, resolved_at, stores(name, name_ar, phone), sub_orders(id, status, part_no, parts_total, order_items(quantity, size, color, products(name, name_ar, product_no)), orders(id, order_no, customers(name, phone, member_no)))'
      )
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) loadError = true;
    else issues = data ?? [];
  } catch {
    loadError = true;
  }

  const open = issues.filter((i) => i.status === 'open').reverse();
  const resolved = issues.filter((i) => i.status !== 'open').slice(0, 15);

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <AutoRefresh seconds={30} />

      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → العودة إلى الطلبات
      </Link>
      <h1>بلاغات المحلات</h1>

      {loadError && (
        <p style={{ color: '#b00' }}>تعذّر تحميل البلاغات. تأكد إنو جدول order_issues موجود بالقاعدة.</p>
      )}

      {!loadError && open.length === 0 && <p style={{ color: '#177a3c' }}>ما في بلاغات مفتوحة.</p>}

      {open.map((i) => {
        const sub = i.sub_orders || {};
        const ord = sub.orders || {};
        const cust = ord.customers || {};
        const st = i.stores || {};
        const orderNo = ord.order_no || (ord.id ? String(ord.id).slice(0, 8).toUpperCase() : '');
        const canCancel = ['new', 'confirmed', 'ready'].includes(sub.status);
        const custWa = cust.phone ? waLink(cust.phone) : '';

        return (
          <div key={i.id} style={{ ...card, borderColor: '#e2b0b0', background: '#fff9f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b>{st.name_ar || st.name}</b>
              <span style={{ fontSize: 12, color: '#777' }}>{ago(i.created_at)}</span>
            </div>

            <div style={{ marginTop: 6, fontWeight: 700, color: '#b00' }}>{REASON_AR[i.reason] || i.reason}</div>
            {i.note ? <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{i.note}</div> : null}

            <div style={{ marginTop: 10, fontSize: 14 }}>
              {ord.id ? (
                <Link href={`/admin/orders/${ord.id}`} style={{ color: '#111' }}>
                  طلب <bdi dir="ltr">#{orderNo}</bdi>
                </Link>
              ) : null}
              {sub.parts_total > 1 ? ` · طرد ${sub.part_no} من ${sub.parts_total}` : ''}
              {sub.status ? ` · ${STATUS_AR[sub.status] || sub.status}` : ''}
            </div>

            {(sub.order_items ?? []).map((it, idx) => {
              const p = it.products;
              const name = p ? p.name_ar || p.name : '';
              const d = [it.size ? sizeLabel('ar', it.size) : '', it.color ? colorLabel('ar', it.color) : '']
                .filter(Boolean)
                .join(' / ');
              return (
                <div key={idx} style={{ fontSize: 14, marginTop: 4 }}>
                  {name} × {it.quantity}
                  {p && p.product_no ? <span style={{ color: '#777', fontSize: 12 }}> · رقم {p.product_no}</span> : null}
                  {d ? <span style={{ color: '#777', fontSize: 13 }}> ({d})</span> : null}
                </div>
              );
            })}

            <div style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
              الزبون: <b>{cust.name}</b> · <bdi dir="ltr">{cust.phone}</bdi>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {cust.phone ? (
                <a href={`tel:${cust.phone}`} style={pill}>
                  اتصال بالزبون
                </a>
              ) : null}
              {custWa ? (
                <a href={custWa} target="_blank" rel="noreferrer" style={pill}>
                  واتساب الزبون
                </a>
              ) : null}
              {st.phone ? (
                <a href={`tel:${st.phone}`} style={pill}>
                  اتصال بالمحل
                </a>
              ) : null}
            </div>

            <IssueButtons id={i.id} canCancel={canCancel} />
          </div>
        );
      })}

      {resolved.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>بلاغات محلولة ({resolved.length})</summary>
          <div style={{ marginTop: 10 }}>
            {resolved.map((i) => {
              const st = i.stores || {};
              const ord = (i.sub_orders && i.sub_orders.orders) || {};
              const orderNo = ord.order_no || (ord.id ? String(ord.id).slice(0, 8).toUpperCase() : '');
              return (
                <div key={i.id} style={{ ...card, fontSize: 14 }}>
                  <b>{st.name_ar || st.name}</b> · {REASON_AR[i.reason] || i.reason}
                  <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
                    {orderNo ? (
                      <>
                        طلب <bdi dir="ltr">#{orderNo}</bdi> ·{' '}
                      </>
                    ) : null}
                    {i.resolved_at ? ago(i.resolved_at) : ''}
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
