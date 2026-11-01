import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const money = (v) => `${Number(v).toFixed(2)} JD`;

export default async function OrderPage({ params }) {
  const { id } = await params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, subtotal, delivery_fee, total, status, address, notes, payment_method, customers(name, phone)')
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' };

  if (!order) {
    return (
      <main style={wrap}>
        <Link href="/" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>← Back to SHEOUT</Link>
        <h2>Order not found</h2>
      </main>
    );
  }

  const { data: subOrders } = await supabaseAdmin
    .from('sub_orders')
    .select('id, subtotal, status, stores(name), order_items(quantity, price, size, color, products(name))')
    .eq('order_id', id);

  const shortId = String(order.id).slice(0, 8).toUpperCase();

  return (
    <main style={wrap}>
      <h1 style={{ marginBottom: 4 }}>Thank you!</h1>
      <p style={{ marginTop: 0, color: '#555' }}>
        Your order <b>#{shortId}</b> has been placed. Payment on delivery.
      </p>

      <div style={{ fontSize: 14, lineHeight: 1.8, margin: '12px 0' }}>
        <div>Name: {order.customers?.name}</div>
        <div>Phone: {order.customers?.phone}</div>
        <div>Address: {order.address}</div>
        {order.notes && <div>Notes: {order.notes}</div>}
        <div>Status: {order.status}</div>
      </div>

      {(subOrders ?? []).map((so) => (
        <section key={so.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <h3 style={{ margin: '0 0 8px' }}>{so.stores?.name}</h3>
          {(so.order_items ?? []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderTop: '1px solid #f3f3f3' }}>
              <div>
                {it.products?.name} × {it.quantity}
                <div style={{ fontSize: 12, color: '#777' }}>
                  {[it.size, it.color].filter(Boolean).join(' / ')}
                </div>
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

      <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: 20, color: '#111' }}>
        Continue shopping
      </Link>
    </main>
  );
}
