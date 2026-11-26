import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { TABLES, PART } from '@/lib/backuptables';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const table = String(url.searchParams.get('table') || '');
  const part = Math.max(1, Math.floor(Number(url.searchParams.get('part')) || 1));
  const def = TABLES.find((t) => t[0] === table);
  if (!def) return NextResponse.json({ error: 'unknown table' }, { status: 400 });

  const from = (part - 1) * PART;
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .order(def[2], { ascending: true })
    .range(from, from + PART - 1);
  if (error) return NextResponse.json({ error: 'read failed' }, { status: 500 });

  const rows = data ?? [];
  const text = JSON.stringify({
    table,
    part,
    exported_at: new Date().toISOString(),
    count: rows.length,
    rows,
  });
  if (Buffer.byteLength(text) > 4300000) {
    return NextResponse.json({ error: 'part too large' }, { status: 413 });
  }

  const day = new Date().toISOString().slice(0, 10);
  return new Response(text, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="sheout-${table}-part${part}-${day}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
