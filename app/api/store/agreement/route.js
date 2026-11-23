import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoreSession } from '@/lib/storeauth';
import { AGREEMENT_VERSION } from '@/lib/agreement';

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
  if (body.confirm !== true) return fail('لازم تؤكد الموافقة', 400);

  const name = (account.stores && (account.stores.name_ar || account.stores.name)) || '';
  const { error } = await supabaseAdmin.from('store_agreements').upsert(
    {
      store_id: account.store_id,
      account_id: account.id,
      accepted_by: account.username || name,
      version: AGREEMENT_VERSION,
    },
    { onConflict: 'store_id,version', ignoreDuplicates: true }
  );

  if (error) return fail('تعذّر حفظ الموافقة، حاول مرة أخرى', 500);
  return NextResponse.json({ ok: true });
}
