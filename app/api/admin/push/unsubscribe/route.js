import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'انتهت الجلسة' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const endpoint = String((body && body.endpoint) || '');
  if (!endpoint) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  await supabaseAdmin.from('admin_push_subscriptions').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
