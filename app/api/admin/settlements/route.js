import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

function amountOf(v) {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 && n <= 100000 ? n : null;
}

export async function POST(request) {
  if (!(await isAdmin())) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح');
  }

  const action = String(body.action || '');
  const note = String(body.note || '').trim().slice(0, 200) || null;

  if (action === 'cash_receive') {
    const amount = amountOf(body.amount);
    if (!amount) return fail('اكتب مبلغ صحيح');
    const { data: courier } = await supabaseAdmin
      .from('courier_accounts')
      .select('id')
      .eq('id', String(body.courierId || ''))
      .maybeSingle();
    if (!courier) return fail('المندوب غير موجود', 404);

    const { error } = await supabaseAdmin.from('cash_handovers').insert({ courier_id: courier.id, amount, note });
    if (error) return fail('تعذّر الحفظ', 500);
    return NextResponse.json({ ok: true });
  }

  if (action === 'store_payout') {
    const amount = amountOf(body.amount);
    if (!amount) return fail('اكتب مبلغ صحيح');
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('id', String(body.storeId || ''))
      .maybeSingle();
    if (!store) return fail('المحل غير موجود', 404);

    const method = String(body.method || '').trim().slice(0, 40) || null;
    const { error } = await supabaseAdmin.from('store_payouts').insert({ store_id: store.id, amount, method, note });
    if (error) return fail('تعذّر الحفظ', 500);
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete_record') {
    const id = String(body.id || '');
    const table = body.kind === 'payout' ? 'store_payouts' : body.kind === 'handover' ? 'cash_handovers' : '';
    if (!table) return fail('نوع غير معروف');
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
    if (error) return fail('تعذّر الحذف', 500);
    return NextResponse.json({ ok: true });
  }

  return fail('إجراء غير معروف');
}
