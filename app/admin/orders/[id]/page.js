import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import StatusSelect from '@/components/statusselect';

export const dynamic = 'force-dynamic';

const money = (v) => `${Number(v).toFixed(2)} JD`;
const when = (v) => String(v).replace('T', ' ').slice(0, 16);

export default async function AdminOrderPage({ params }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const { id } = await params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, subtotal, delivery_fee, total, status, address, notes, payment_method, created_at, customers(name, phone)')
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' };
  const back = (
    <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
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
    .select('id, subtotal, status, stores(name, phone), order_items(quantity, price, size, color, products(name))')
    .eq('order_id', id);

  return (
    <main style={wrap}>
      {back}
      <h1 style={{ marginBottom: 4 }}>Order #{String(order.id).slice(0, 8).toUpperCase()}</h1>
      <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
        <div>Placed: {when(order.created_at)}</div>
        <div>Customer: {order.customers?.name} · {order.customers?.phone}</div>
        <div>Address: {order.address}</div>
        {order.notes && <div>Notes: {order.notes}</div>}
        <div>Payment: {order.payment_method === 'cod' ? 'Cash on delivery' : order.payment_method}</div>
        <div>Order status: <b>{order.status}</b></div>
      </div>

      {(subOrders ?? []).map((so) => (
        <section key={so.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>{so.stores?.name}</h3>
            <StatusSelect id={so.id} current={so.status} />
          </div>
          {so.stores?.phone && <div style={{ fontSize: 12, color: '#777' }}>Store phone: {so.stores.phone}</div>}
          {(so.order_items ?? []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderTop: '1px solid #f3f3f3' }}>
              <div>
                {it.products?.name} × {it.quantity}
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
