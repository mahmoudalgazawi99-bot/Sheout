import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import LangToggle from '@/components/LangToggle';
import AutoRefresh from '@/components/autorefresh';
import { getLang } from '@/lib/serverlang';
import { money, pick, sizeLabel, colorLabel } from '@/lib/i18n';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

// Put the support phone number here to show it on the page (example: '0790000000')
const SUPPORT_PHONE = '';

const STAGES = ['new', 'confirmed', 'ready', 'picked_up', 'delivered'];

const LABELS = {
  ar: {
    new: 'تم استلام الطلب',
    confirmed: 'قيد التجهيز',
    ready: 'جاهز',
    picked_up: 'بالطريق إليك',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  },
  en: {
    new: 'Order received',
    confirmed: 'Preparing',
    ready: 'Ready',
    picked_up: 'On the way',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  },
};

function firstImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && first.url) return String(first.url);
  return null;
}

function stageOf(subs) {
  const active = subs.filter((s) => s.status !== 'cancelled');
  if (subs.length > 0 && active.length === 0) return -1;
  if (active.length === 0) return 0;
  return Math.min(...active.map((s) => Math.max(0, STAGES.indexOf(s.status))));
}

export default async function OrderPage({ params }) {
  const lang = await getLang();
  const ar = lang === 'ar';
  const L = LABELS[ar ? 'ar' : 'en'];
  const { id } = await params;

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, subtotal, delivery_fee, total, customers(member_no)')
    .eq('id', id)
    .maybeSingle();

  const wrap = { maxWidth: 720, margin: '0 auto', padding: 16 };
  const back = (
    <Link href="/" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
      {ar ? '→ ' : '← '}
      {ar ? 'العودة إلى SHEOUT' : 'Back to SHEOUT'}
    </Link>
  );

  if (!order) {
    return (
      <main style={wrap}>
        {back}
        <h2 style={{ fontFamily: theme.serif }}>{ar ? 'الطلب غير موجود' : 'Order not found'}</h2>
      </main>
    );
  }

  const { data: subOrders } = await supabaseAdmin
    .from('sub_orders')
    .select('id, status, order_items(quantity, price, size, color, products(name, name_ar, images))')
    .eq('order_id', id);

  const subs = subOrders ?? [];
  const stage = stageOf(subs);
  const items = subs.flatMap((so) => (so.order_items ?? []).map((it) => ({ ...it, status: so.status })));
  const orderNo = order.order_no || String(order.id).slice(0, 8).toUpperCase();
  const memberNo = order.customers ? order.customers.member_no : null;

  return (
    <main style={wrap}>
      <AutoRefresh seconds={30} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {back}
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
        <h1 style={{ fontFamily: theme.serif, fontSize: 30, fontWeight: 600, margin: 0 }}>
          {ar ? 'شكراً لك!' : 'Thank you!'}
        </h1>
        <p style={{ color: theme.muted, margin: '8px 0 0' }}>{ar ? 'رقم طلبك' : 'Your order number'}</p>
        <div style={{ margin: '4px 0 0' }}>
          <bdi dir="ltr" style={{ color: theme.gold, fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>
            {orderNo}
          </bdi>
        </div>
        {memberNo ? (
          <p style={{ color: theme.muted, margin: '8px 0 0', fontSize: 13 }}>
            {ar ? 'رقم عضويتك: ' : 'Your membership number: '}
            <bdi dir="ltr" style={{ color: theme.ink, fontWeight: 600 }}>
              {memberNo}
            </bdi>
          </p>
        ) : null}
        <p style={{ color: theme.muted, margin: '8px 0 0', fontSize: 13 }}>
          {ar ? 'الدفع عند الاستلام.' : 'Payment on delivery.'}
        </p>
      </div>

      <section
        style={{
          background: theme.card,
          border: `1px solid ${theme.line}`,
          borderRadius: theme.radius,
          boxShadow: theme.shadow,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {stage === -1 ? (
          <div style={{ textAlign: 'center', color: '#b00', fontWeight: 700 }}>
            {ar ? 'تم إلغاء الطلب' : 'This order was cancelled'}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            {STAGES.map((s, i) => {
              const done = i <= stage;
              return (
                <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      margin: '0 auto 6px',
                      background: done ? theme.ink : theme.card,
                      color: done ? theme.gold : theme.muted,
                      border: `2px solid ${done ? theme.ink : theme.line}`,
                      lineHeight: '24px',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: done ? theme.ink : theme.muted,
                      fontWeight: i === stage ? 700 : 400,
                    }}
                  >
                    {L[s]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 12, textAlign: 'center' }}>
          {ar ? 'بتتحدث الحالة تلقائياً.' : 'The status updates automatically.'}
        </div>
      </section>

      <section
        style={{
          background: theme.card,
          border: `1px solid ${theme.line}`,
          borderRadius: theme.radius,
          boxShadow: theme.shadow,
          padding: '4px 14px',
          marginBottom: 14,
        }}
      >
        {items.map((it, idx) => {
          const p = it.products;
          const name = p ? pick(lang, p.name, p.name_ar) : '';
          const details = [it.size ? sizeLabel(lang, it.size) : '', it.color ? colorLabel(lang, it.color) : '']
            .filter(Boolean)
            .join(' / ');
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 0',
                borderTop: idx === 0 ? 'none' : `1px solid ${theme.line}`,
              }}
            >
              <img
                src={(p && firstImage(p.images)) || ''}
                alt={name}
                style={{ width: 56, height: 68, objectFit: 'cover', borderRadius: 10, background: theme.goldSoft }}
              />
              <div style={{ flex: 1, fontSize: 14 }}>
                <b>
                  {name} × {it.quantity}
                </b>
                {details && <div style={{ fontSize: 12, color: theme.muted }}>{details}</div>}
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    color: it.status === 'cancelled' ? '#b00' : theme.gold,
                    fontWeight: 600,
                  }}
                >
                  {L[it.status] || it.status}
                </div>
              </div>
              <b style={{ fontSize: 14 }}>{money(lang, it.price * it.quantity)}</b>
            </div>
          );
        })}
      </section>

      <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14, lineHeight: 1.9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{ar ? 'المنتجات' : 'Items'}</span>
          <span>{money(lang, order.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{ar ? 'التوصيل' : 'Delivery'}</span>
          <span>{money(lang, order.delivery_fee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
          <b style={{ fontFamily: theme.serif }}>{ar ? 'المجموع' : 'Total'}</b>
          <b>{money(lang, order.total)}</b>
        </div>
      </div>

      <p style={{ fontSize: 13, color: theme.muted, lineHeight: 1.8, marginTop: 18 }}>
        {ar
          ? 'احتفظ برقم طلبك. بتقدر تتابع حالته أي وقت من صفحة '
          : 'Keep your order number. You can follow its status anytime from the '}
        <Link href="/track" style={{ color: theme.gold, fontWeight: 600 }}>
          {ar ? 'تتبّع طلبك' : 'Track your order'}
        </Link>
        .
        {SUPPORT_PHONE ? (
          <>
            {' '}
            {ar ? 'للاستفسار: ' : 'Questions: '}
            <a href={`tel:${SUPPORT_PHONE}`} dir="ltr" style={{ color: theme.ink, fontWeight: 600 }}>
              {SUPPORT_PHONE}
            </a>
          </>
        ) : null}
      </p>

      <Link
        href="/"
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 16,
          padding: 16,
          borderRadius: 999,
          background: theme.ink,
          color: theme.gold,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {ar ? 'متابعة التسوق' : 'Continue shopping'}
      </Link>
    </main>
  );
}
