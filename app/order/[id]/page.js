import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import LangToggle from '@/components/LangToggle';
import { getLang } from '@/lib/serverlang';
import { t, money, pick, sizeLabel, colorLabel, statusLabel } from '@/lib/i18n';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }) {
  const lang = await getLang();
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
        <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
          {lang === 'ar' ? '→ ' : '← '}
          {t(lang, 'backTo')}
        </Link>
        <h2 style={{ fontFamily: theme.serif }}>{t(lang, 'orderNotFound')}</h2>
      </main>
    );
  }

  const { data: subOrders } = await supabaseAdmin
    .from('sub_orders')
    .select('id, subtotal, status, stores(name, name_ar), order_items(quantity, price, size, color, products(name, name_ar))')
    .eq('order_id', id);

  const shortId = String(order.id).slice(0, 8).toUpperCase();

  return (
    <main style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LangToggle />
      </div>

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
        <h1 style={{ fontFamily: theme.serif, fontSize: 30, fontWeight: 600, margin: 0 }}>{t(lang, 'thankYou')}</h1>
        <p style={{ color: theme.muted, margin: '8px 0 0' }}>
          {lang === 'ar' ? 'تم استلام طلبك رقم ' : 'Your order '}
          <bdi style={{ color: theme.gold, fontWeight: 700 }}>#{shortId}</bdi>
          {lang === 'ar' ? '. الدفع عند الاستلام.' : ' has been placed. Payment on delivery.'}
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
        <div>{t(lang, 'name')}: {order.customers?.name}</div>
        <div>{t(lang, 'phone')}: <bdi>{order.customers?.phone}</bdi></div>
        <div>{t(lang, 'address')}: {order.address}</div>
        {order.notes && <div>{t(lang, 'notes').replace(' (اختياري)', '').replace(' (optional)', '')}: {order.notes}</div>}
        <div>{t(lang, 'status')}: {statusLabel(lang, order.status)}</div>
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
          <h3 style={{ fontFamily: theme.serif, fontSize: 18, margin: '0 0 8px' }}>
            {so.stores ? pick(lang, so.stores.name, so.stores.name_ar) : ''}
          </h3>
          {(so.order_items ?? []).map((it, idx) => (
            <div
              key={idx}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderTop: `1px solid ${theme.line}` }}
            >
              <div>
                {it.products ? pick(lang, it.products.name, it.products.name_ar) : ''} × {it.quantity}
                <div style={{ fontSize: 12, color: theme.muted }}>
                  {[it.size ? sizeLabel(lang, it.size) : '', it.color ? colorLabel(lang, it.color) : '']
                    .filter(Boolean)
                    .join(' / ')}
                </div>
              </div>
              <b>{money(lang, it.price * it.quantity)}</b>
            </div>
          ))}
          <div style={{ textAlign: 'end', marginTop: 8, fontSize: 14 }}>
            {t(lang, 'storeSubtotal')}: <b style={{ color: theme.gold }}>{money(lang, so.subtotal)}</b>
          </div>
        </section>
      ))}

      <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14, lineHeight: 1.9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t(lang, 'items')}</span>
          <span>{money(lang, order.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t(lang, 'delivery')}</span>
          <span>{money(lang, order.delivery_fee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
          <b style={{ fontFamily: theme.serif }}>{t(lang, 'total')}</b>
          <b>{money(lang, order.total)}</b>
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
        {t(lang, 'continueShopping')}
      </Link>
    </main>
  );
}
