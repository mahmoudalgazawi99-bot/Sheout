import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { COMPLAINT_STATUS, NOTE_TAGS } from '@/lib/feedback';

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

  if (action === 'complaint_update') {
    const id = String(body.id || '');
    const status = String(body.status || '');
    const reply = String(body.reply || '').trim().slice(0, 500);
    if (!COMPLAINT_STATUS.some(([k]) => k === status)) return fail('حالة غير صالحة');

    const { error } = await supabaseAdmin
      .from('complaints')
      .update({ status, admin_reply: reply || null, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return fail('تعذّر الحفظ', 500);
    return NextResponse.json({ ok: true });
  }

  if (action === 'review_toggle') {
    const id = String(body.id || '');
    const { data: r } = await supabaseAdmin.from('product_reviews').select('id, status').eq('id', id).maybeSingle();
    if (!r) return fail('التقييم غير موجود', 404);

    const { error } = await supabaseAdmin
      .from('product_reviews')
      .update({ status: r.status === 'visible' ? 'hidden' : 'visible' })
      .eq('id', id);
    if (error) return fail('تعذّر الحفظ', 500);
    return NextResponse.json({ ok: true });
  }

  if (action === 'note_add') {
    const customerId = String(body.customerId || '');
    const tags = (Array.isArray(body.tags) ? body.tags.map(String) : [])
      .filter((t) => NOTE_TAGS.some(([k]) => k === t))
      .slice(0, 8);
    const note = String(body.note || '').trim().slice(0, 300);
    if (tags.length === 0 && !note) return fail('اكتب ملاحظة أو اختار وسم');

    const { data: cust } = await supabaseAdmin.from('customers').select('id').eq('id', customerId).maybeSingle();
    if (!cust) return fail('الزبون غير موجود', 404);

    const { error } = await supabaseAdmin.from('customer_notes').insert({
      customer_id: customerId,
      author_type: 'admin',
      author_name: 'الأدمن',
      tags,
      note: note || null,
    });
    if (error) return fail('تعذّر الحفظ', 500);
    return NextResponse.json({ ok: true });
  }

  if (action === 'note_delete') {
    const id = String(body.id || '');
    const { error } = await supabaseAdmin.from('customer_notes').delete().eq('id', id);
    if (error) return fail('تعذّر الحذف', 500);
    return NextResponse.json({ ok: true });
  }

  return fail('إجراء غير معروف');
}
