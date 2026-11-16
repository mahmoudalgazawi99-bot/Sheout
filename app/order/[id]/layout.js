import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function OrderLayout({ children, params }) {
  const { id } = await params;

  let target = null;
  try {
    const { data } = await supabaseAdmin.from('order_aliases').select('new_id').eq('old_id', id).maybeSingle();
    if (data && data.new_id) target = data.new_id;
  } catch {}

  if (target) redirect(`/order/${target}`);
  return children;
}
