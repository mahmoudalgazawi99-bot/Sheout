import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

const money = (v) => `${Number(v).toFixed(2)} JD`;

export default async function OrderPage({ params }) {
  const { id } = await params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, subtotal, delivery_fee, total, status, address, notes, payment_method, customers(name, phone)')
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16 };

  if (!order) {
    return (
      <main style={wrap}>
        <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>← Back to SHEOUT</Link>
        <h2 style={{ fontFamily: theme.serif }}>Order not found</h2>
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
      <div style={{ textAlign: 'center', margin: '18px 0 20px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: theme.ink,
            color: theme.gold,
            fontSize: 28,
            lineHeight: '56px',
            margin: '0 auto 12px',
          }}
        >
          ✓
        </div>
        <h1 style={{ fontFamily: theme.serif, fontSize: 30, fontWeight: 600, margin: 0 }}>Thank you!</h1>
        <p style={{ color: theme.muted, margin: '8px 0 0' }}>
          Your order <b style={{ color: theme.gold }}>#{shortId}</b> has been placed. Payment on delivery.
        </p>
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.9,
          background: theme.goldSoft,
          borderRadius: theme.radius,
          padding: '12px 16px',
          marginBottom: 16,
        }}
      >
        <div>Name: {order.customers?.name}</div>
        <div>Phone: {order.customers?.phone}</div>
        <div>Address: {order.address}</div>
        {order.notes && <div>Notes: {order.notes}</div>}
        <div>Status: {order.status}</div>
      </div>

      {(subOrders ?? []).map((so) => (
        <section
          key={so.id}
          style={{
            background: theme.card,
            border: `1px solid ${theme.line}`,
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontFamily: theme.serif, fontSize: 18, margin: '0 0 8px' }}>{so.stores?.name}</h3>
          {(so.order_items ?? []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderTop: `1px solid ${theme.line}` }}>
              <div>
                {it.products?.name} × {it.quantity}
                <div style={{ fontSize: 12, color: theme.muted }}>
                  {[it.size, it.color].filter(Boolean).join(' / ')}
                </div>
              </div>
              <b>{money(it.price * it.quantity)}</b>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: 8, fontSize: 14 }}>
            Store subtotal: <b style={{ color: theme.gold }}>{money(so.subtotal)}</b>
          </div>
        </section>
      ))}

      <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14, lineHeight: 1.9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Items</span><span>{money(order.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span>{money(order.delivery_fee)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
          <b style={{ fontFamily: theme.serif }}>Total</b>
          <b>{money(order.total)}</b>
        </div>
      </div>

      <Link
        href="/"
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 22,
          padding: 16,
          borderRadius: 999,
          background: theme.ink,
          color: theme.gold,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Continue shopping
      </Link>
    </main>
  );
}
