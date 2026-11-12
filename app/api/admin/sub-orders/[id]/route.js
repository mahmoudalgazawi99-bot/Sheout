import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { stampsFor } from '@/lib/statusstamps';
import { refreshOrderStatus } from '@/lib/orderstatus';

const STATUSES = ['new', 'confirmed', 'ready', 'picked_up', 'delivered', 'cancelled'];

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const status = String(body.status || '');
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: current } = await supabaseAdmin
    .from('sub_orders')
    .select('id, confirmed_at, ready_at, picked_up_at, delivered_at')
    .eq('id', id)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('sub_orders')
    .update(stampsFor(status, current))
    .eq('id', id)
    .select('order_id')
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json({ error: 'Could not update' }, { status: 500 });
  }

  const orderStatus = await refreshOrderStatus(updated.order_id);

  return NextResponse.json({ ok: true, orderStatus });
}
