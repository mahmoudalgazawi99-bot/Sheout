import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCourierSession, canPickup } from '@/lib/courierauth';

const fail = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const courier = await getCourierSession();
  if (!courier) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);
  if (!canPickup(courier.role)) return fail('هذا الحساب ما إله صلاحية التوصيل', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح', 400);
  }

  const orderId = String(body.orderId || '');

  const { data: claimed } = await supabaseAdmin
    .from('orders')
    .update({ courier_id: courier.id, out_for_delivery_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('courier_id', null)
    .not('packed_at', 'is', null)
    .select('id');

  if (!claimed || claimed.length === 0) {
    return fail('هذا الطلب مش متاح، يمكن أخده مندوب ثاني', 409);
  }

  return NextResponse.json({ ok: true });
}
