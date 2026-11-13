import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { stampsFor } from '@/lib/statusstamps';
import { refreshOrderStatus } from '@/lib/orderstatus';

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (!(await isAdmin())) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح');
  }

  const action = String(body.action || '');
  const id = String(body.id || '');

  if (action !== 'resolve' && action !== 'cancel_part') return fail('إجراء غير معروف');

  const { data: issue } = await supabaseAdmin
    .from('order_issues')
    .select('id, status, sub_order_id')
    .eq('id', id)
    .maybeSingle();

  if (!issue) return fail('البلاغ غير موجود', 404);
  if (issue.status !== 'open') return fail('هذا البلاغ محلول مسبقاً');

  if (action === 'cancel_part') {
    const { data: sub } = await supabaseAdmin
      .from('sub_orders')
      .select('id, status, order_id')
      .eq('id', issue.sub_order_id)
      .maybeSingle();

    if (!sub) return fail('الطرد غير موجود', 404);
    if (!['new', 'confirmed', 'ready'].includes(sub.status)) {
      return fail('ما بتقدر تلغي هذا الطرد بحالته الحالية');
    }

    const { error: cancelError } = await supabaseAdmin
      .from('sub_orders')
      .update(stampsFor('cancelled', {}))
      .eq('id', sub.id);

    if (cancelError) return fail('تعذّر إلغاء الطرد', 500);
    await refreshOrderStatus(sub.order_id);
  }

  const { error } = await supabaseAdmin
    .from('order_issues')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'open');

  if (error) return fail('تعذّر تحديث البلاغ', 500);
  return NextResponse.json({ ok: true });
}
