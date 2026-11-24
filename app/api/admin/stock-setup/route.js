import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { fetchAll } from '@/lib/dbpage';
import { comboList, splitQuantity } from '@/lib/variants';

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (!(await isAdmin())) return fail('انتهت الجلسة، سجّل الدخول من جديد', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('طلب غير صالح');
  }

  const mode = body.mode === 'split' ? 'split' : body.mode === 'each' ? 'each' : '';
  if (!mode) return fail('اختار طريقة التعبئة');

  const products = await fetchAll(() =>
    supabaseAdmin.from('products').select('id, sizes, colors, quantity').order('id', { ascending: true })
  );
  const existing = await fetchAll(() =>
    supabaseAdmin.from('product_variants').select('id, product_id').order('id', { ascending: true })
  );
  const has = new Set(existing.map((v) => v.product_id));

  let productsDone = 0;
  let created = 0;

  for (const p of products) {
    if (has.has(p.id)) continue;
    const combos = comboList(p.sizes, p.colors);
    const total = Math.max(0, Math.floor(Number(p.quantity) || 0));
    const parts = mode === 'split' ? splitQuantity(total, combos.length) : combos.map(() => total);
    const rows = combos.map((c, i) => ({ product_id: p.id, size: c.size, color: c.color, quantity: parts[i] }));

    const { error } = await supabaseAdmin.from('product_variants').insert(rows);
    if (error) continue;

    const sum = rows.reduce((s, r) => s + r.quantity, 0);
    await supabaseAdmin.from('products').update({ quantity: sum }).eq('id', p.id);
    productsDone += 1;
    created += rows.length;
  }

  return NextResponse.json({ ok: true, productsDone, created });
}
