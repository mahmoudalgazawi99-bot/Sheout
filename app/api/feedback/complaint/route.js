import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendToAdmins } from '@/lib/push';
import { clientKey, isLimited } from '@/lib/ratelimit';
import { COMPLAINT_TYPES, typeLabel } from '@/lib/feedback';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (await isLimited('complaint-ip:' + clientKey(request), 10, 600)) {
    return fail('محاولات كثيرة، جرّب بعد شوي', 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const orderId = String(body.orderId || '');
  const type = String(body.type || '');
  const message = String(body.message || '').trim().slice(0, 500);
  const productId = body.productId ? String(body.productId) : null;

  if (!COMPLAINT_TYPES.some(([k]) => k === type)) return fail('اختار نوع الشكوى', 400);
  if (message.length < 5) return fail('اكتب تفاصيل الشكوى (5 أحرف على الأقل)', 400);

  if (await isLimited('complaint-order:' + orderId, 3, 86400)) {
    return fail('وصلتنا عدة شكاوى على هذا الطلب، رح نتواصل معك', 429);
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, customer_id, sub_orders(status, order_items(product_id))')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return fail('الطلب غير موجود', 404);

  const delivered = (order.sub_orders ?? []).filter((s) => s.status === 'delivered');
  if (delivered.length === 0) return fail('بتقدر تقدّم شكوى بعد توصيل الطلب', 400);

  let pid = null;
  if (productId) {
    const inOrder = delivered.some((s) => (s.order_items ?? []).some((i) => i.product_id === productId));
    if (inOrder) pid = productId;
  }

  const { error } = await supabaseAdmin.from('complaints').insert({
    order_id: order.id,
    customer_id: order.customer_id,
    product_id: pid,
    type,
    message,
  });

  if (error) return fail('تعذّر إرسال الشكوى، حاول مرة أخرى', 500);

  try {
    const orderNo = order.order_no || String(order.id).slice(0, 8).toUpperCase();
    await sendToAdmins({
      title: 'شكوى جديدة',
      body: `#${orderNo}: ${typeLabel(type, 'ar')}`,
      url: '/admin/complaints',
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
