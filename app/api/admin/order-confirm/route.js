import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (!(await isAdmin())) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح');
  }

  const orderId = String(body.orderId || '');
  const confirmed = body.confirmed === true;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ confirmed_at: confirmed ? new Date().toISOString() : null })
    .eq('id', orderId)
    .select('id')
    .maybeSingle();

  if (error) return fail('تعذّر الحفظ. تأكد إنك نفّذت أمر القاعدة', 500);
  if (!data) return fail('الطلب غير موجود', 404);
  return NextResponse.json({ ok: true });
}
