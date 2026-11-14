import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { clientKey, isLimited } from '@/lib/ratelimit';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (await isLimited('review-ip:' + clientKey(request), 20, 600)) {
    return fail('محاولات كثيرة، جرّب بعد شوي', 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const orderId = String(body.orderId || '');
  const productId = String(body.productId || '');
  const rating = Number(body.rating);
  const comment = String(body.comment || '').trim().slice(0, 400);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('اختار عدد النجوم', 400);

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, customer_id, customers(name), sub_orders(status, order_items(product_id))')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return fail('الطلب غير موجود', 404);

  const delivered = (order.sub_orders ?? []).filter((s) => s.status === 'delivered');
  const owns = delivered.some((s) => (s.order_items ?? []).some((i) => i.product_id === productId));
  if (!owns) return fail('بتقدر تقيّم المنتج بعد ما تستلمه', 400);

  const first = String((order.customers && order.customers.name) || '').trim().split(/\s+/)[0];
  const displayName = (first || 'عميل').slice(0, 30);

  const { error } = await supabaseAdmin.from('product_reviews').upsert(
    {
      product_id: productId,
      order_id: order.id,
      customer_id: order.customer_id,
      display_name: displayName,
      rating,
      comment: comment || null,
    },
    { onConflict: 'order_id,product_id' }
  );

  if (error) return fail('تعذّر حفظ التقييم، حاول مرة أخرى', 500);
  return NextResponse.json({ ok: true });
}
