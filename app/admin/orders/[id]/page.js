import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import StatusSelect from '@/components/statusselect';
import { tagLabel } from '@/lib/feedback';
import { ago } from '@/lib/contact';

export const dynamic = 'force-dynamic';

const money = (v) => `${Number(v).toFixed(2)} JD`;
const when = (v) => String(v).replace('T', ' ').slice(0, 16);

export default async function AdminOrderPage({ params }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const { id } = await params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(
      'id, order_no, subtotal, delivery_fee, total, status, address, notes, payment_method, created_at, customers(id, name, phone, member_no, phone_norm)'
    )
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' };
  const back = (
    <Link href="/admin/orders" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
      ← Back to orders
    </Link>
  );

  if (!order) {
    return (
      <main style={wrap}>
        {back}
        <h2>Order not found</h2>
      </main>
    );
  }

  const { data: subOrders } = await supabaseAdmin
    .from('sub_orders')
    .select(
      'id, subtotal, status, part_no, parts_total, stores(name, phone), order_items(quantity, price, size, color, products(name, product_no))'
    )
    .eq('order_id', id)
    .order('part_no', { ascending: true });

  const cust = order.customers || null;
  let notes = [];
  try {
    let ids = cust ? [cust.id] : [];
    if (cust && cust.phone_norm) {
      const { data: same } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('phone_norm', cust.phone_norm)
        .limit(100);
      ids = (same ?? []).map((c) => c.id);
    }
    if (ids.length > 0) {
      const { data: n } = await supabaseAdmin
        .from('customer_notes')
        .select('id, tags, note, author_type, author_name, created_at')
        .in('customer_id', ids)
        .order('created_at', { ascending: false })
        .limit(4);
      notes = n ?? [];
    }
  } catch {}

  const orderNo = order.order_no || String(order.id).slice(0, 8).toUpperCase();

  return (
    <main style={wrap}>
      {back}
      <h1 style={{ marginBottom: 4 }}>Order #{orderNo}</h1>
      <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
        <div>Placed: {when(order.created_at)}</div>
        <div>
          Customer: {cust ? cust.name : ''} · {cust ? cust.phone : ''}
          {cust && cust.member_no ? ` · member ${cust.member_no}` : ''}
          {cust ? (
            <>
              {' · '}
              <Link href={`/admin/customers?id=${cust.id}`} style={{ color: '#111' }}>
                customer profile
              </Link>
            </>
          ) : null}
        </div>
        <div>Address: {order.address}</div>
        {order.notes && <div>Notes: {order.notes}</div>}
        <div>Payment: {order.payment_method === 'cod' ? 'Cash on delivery' : order.payment_method}</div>
        <div>Order status: <b>{order.status}</b></div>
      </div>

      {notes.length > 0 && (
        <div
          dir="rtl"
          lang="ar"
          style={{ border: '1px solid #e2c36b', background: '#fff7e0', borderRadius: 12, padding: 12, marginBottom: 14 }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>ملاحظات سابقة عن هذا الزبون</div>
          {notes.map((n, i) => (
            <div key={n.id} style={{ padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid #f0e2b0' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(n.tags ?? []).map((t) => (
                  <span key={t} style={{ background: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 13 }}>
                    {tagLabel(t)}
                  </span>
                ))}
              </div>
              {n.note ? <div style={{ fontSize: 14, marginTop: 4 }}>{n.note}</div> : null}
              <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                {n.author_type === 'courier' ? 'المندوب' : 'الأدمن'} {n.author_name} · {ago(n.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {(subOrders ?? []).map((so) => (
        <section key={so.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>
              {so.stores?.name}
              {so.parts_total > 1 ? (
                <span style={{ fontSize: 13, color: '#777', fontWeight: 400 }}>
                  {' '}
                  · parcel {so.part_no} of {so.parts_total}
                </span>
              ) : null}
            </h3>
            <StatusSelect id={so.id} current={so.status} />
          </div>
          {so.stores?.phone && <div style={{ fontSize: 12, color: '#777' }}>Store phone: {so.stores.phone}</div>}
          {(so.order_items ?? []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderTop: '1px solid #f3f3f3' }}>
              <div>
                {it.products?.name} × {it.quantity}
                {it.products?.product_no ? (
                  <span style={{ color: '#777', fontSize: 12 }}> · product {it.products.product_no}</span>
                ) : null}
                <div style={{ fontSize: 12, color: '#777' }}>{[it.size, it.color].filter(Boolean).join(' / ')}</div>
              </div>
              <b>{money(it.price * it.quantity)}</b>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: 6 }}>
            Store subtotal: <b>{money(so.subtotal)}</b>
          </div>
        </section>
      ))}

      <div style={{ borderTop: '2px solid #111', paddingTop: 12, lineHeight: 1.8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Items</span><span>{money(order.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span>{money(order.delivery_fee)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}><b>Total</b><b>{money(order.total)}</b></div>
      </div>
    </main>
  );
}
