import { supabaseAdmin } from '@/lib/supabaseAdmin';

export function computeOrderStatus(statuses) {
  const all = statuses || [];
  if (all.length === 0) return 'new';
  const active = all.filter((s) => s !== 'cancelled');
  if (active.length === 0) return 'cancelled';
  if (active.every((s) => s === 'delivered')) return 'delivered';
  if (active.some((s) => s !== 'new')) return 'processing';
  return 'new';
}

export async function refreshOrderStatus(orderId) {
  const { data } = await supabaseAdmin.from('sub_orders').select('status').eq('order_id', orderId);
  const status = computeOrderStatus((data ?? []).map((s) => s.status));
  await supabaseAdmin.from('orders').update({ status }).eq('id', orderId);
  return status;
}
