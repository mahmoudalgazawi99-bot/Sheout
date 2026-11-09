import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { sendToAdmins } from '@/lib/push';

const REASONS = {
  out_of_stock: 'المنتج غير متوفر',
  size_color: 'المقاس أو اللون غير متوفر',
  other: 'سبب آخر',
};

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const account = await getStoreSession();
  if (!account) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const subOrderId = String(body.subOrderId || '');
  const reason = String(body.reason || '');
  const note = String(body.note || '').trim().slice(0, 200);

  if (!REASONS[reason]) return fail('اختار سبب المشكلة', 400);

  const { data: sub } = await supabaseAdmin
    .from('sub_orders')
    .select('id, status, order_id, part_no, parts_total')
    .eq('id', subOrderId)
    .eq('store_id', account.store_id)
    .maybeSingle();

  if (!sub) return fail('الطلب غير موجود', 404);
  if (sub.status !== 'new' && sub.status !== 'confirmed') {
    return fail('ما بتقدر تبلّغ عن هذا الطلب', 400);
  }

  const { data: existing } = await supabaseAdmin
    .from('order_issues')
    .select('id')
    .eq('sub_order_id', subOrderId)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) return fail('تم إبلاغ الإدارة عن هذا الطلب مسبقاً', 409);

  const { error } = await supabaseAdmin.from('order_issues').insert({
    sub_order_id: subOrderId,
    store_id: account.store_id,
    reason,
    note: note || null,
  });

  if (error) return fail('تعذّر إرسال البلاغ، حاول مرة أخرى', 500);

  try {
    const storeName = (account.stores && (account.stores.name_ar || account.stores.name)) || '';
    const { data: ord } = await supabaseAdmin
      .from('orders')
      .select('order_no')
      .eq('id', sub.order_id)
      .maybeSingle();
    const orderNo = (ord && ord.order_no) || String(sub.order_id).slice(0, 8).toUpperCase();
    const parts = sub.parts_total > 1 ? ` · طرد ${sub.part_no} من ${sub.parts_total}` : '';
    await sendToAdmins({
      title: 'مشكلة بطلب',
      body: `${storeName} · #${orderNo}${parts}: ${REASONS[reason]}`,
      url: '/admin/courier',
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
