import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { toDate } from '@/lib/analytics';
import { money } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const GROUPS = [
  ['all', 'الكل', null],
  ['status', 'حالات الطرود', ['sub_orders']],
  ['money', 'النقد والدفعات', ['cash_handovers', 'store_payouts']],
  ['merge', 'الدمج', ['order_aliases']],
  ['accounts', 'الحسابات', ['courier_accounts', 'store_accounts']],
  ['products', 'المنتجات', ['products']],
];

const STATUS_AR = {
  new: 'جديد',
  confirmed: 'مقبول',
  ready: 'جاهز',
  picked_up: 'تم استلامه',
  delivered: 'موصّل',
  cancelled: 'ملغي',
};
const ROLE_AR = { courier: 'مندوب', warehouse: 'مستودع', both: 'الاثنين' };
const OP_AR = { INSERT: 'إضافة', UPDATE: 'تعديل', DELETE: 'حذف' };
const OP_COLOR = { INSERT: '#177a3c', UPDATE: '#b8924a', DELETE: '#b00' };

const jd = (v) => money('ar', v);
const val = (v) => (v === null || v === undefined ? '—' : String(v));

function describe(r, ctx) {
  const o = r.old_data || {};
  const n = r.new_data || {};
  const d = r.op === 'DELETE' ? o : n;
  const lines = [];
  let title = r.table_name;

  if (r.table_name === 'sub_orders') {
    const s = ctx.subs[r.row_id];
    title = s
      ? `طلب #${(s.orders && s.orders.order_no) || '—'} · طرد ${s.part_no}/${s.parts_total} · ${s.stores ? s.stores.name_ar || s.stores.name : ''}`
      : `طرد ${String(r.row_id).slice(0, 8)}`;
    if ('status' in n) lines.push(`الحالة: ${STATUS_AR[o.status] || val(o.status)} ← ${STATUS_AR[n.status] || val(n.status)}`);
    if ('order_id' in n) lines.push('انتقل لطلب آخر (دمج)');
  } else if (r.table_name === 'cash_handovers') {
    const c = ctx.couriers[d.courier_id];
    title = `${r.op === 'DELETE' ? 'حذف تسجيل نقد' : 'استلام نقد'} · ${c ? c.name : ''}`;
    lines.push(`${jd(d.amount)}${d.note ? ` · ${d.note}` : ''}`);
  } else if (r.table_name === 'store_payouts') {
    const s = ctx.stores[d.store_id];
    title = `${r.op === 'DELETE' ? 'حذف دفعة' : 'دفعة'} · ${s ? s.name_ar || s.name : ''}`;
    lines.push(`${jd(d.amount)}${d.method ? ` · ${d.method}` : ''}${d.note ? ` · ${d.note}` : ''}`);
  } else if (r.table_name === 'order_aliases') {
    title = 'دمج طلبات';
    lines.push(`الطلب #${val(n.old_no)} صار جزء من طلب آخر`);
  } else if (r.table_name === 'courier_accounts') {
    const c = ctx.couriers[r.row_id];
    title = `حساب ${c ? c.name : val(d.name || d.username)}`;
    if (r.op === 'INSERT') lines.push(`إنشاء حساب (${ROLE_AR[n.role] || val(n.role)})`);
    if (r.op === 'DELETE') lines.push('حذف الحساب');
    if (r.op === 'UPDATE') {
      if ('password_hash' in n) lines.push('تغيير كلمة السر');
      if ('is_active' in n) lines.push(n.is_active ? 'تفعيل الحساب' : 'تعطيل الحساب');
      if ('role' in n) lines.push(`الدور: ${ROLE_AR[o.role] || val(o.role)} ← ${ROLE_AR[n.role] || val(n.role)}`);
      if ('username' in n) lines.push(`اليوزر: ${val(o.username)} ← ${val(n.username)}`);
      if ('name' in n) lines.push(`الاسم: ${val(o.name)} ← ${val(n.name)}`);
    }
  } else if (r.table_name === 'store_accounts') {
    const a = ctx.saccs[r.row_id];
    title = `حساب محل ${a ? `${a.username} (${a.stores ? a.stores.name_ar || a.stores.name : ''})` : val(d.username)}`;
    if (r.op === 'INSERT') lines.push('إنشاء حساب');
    if (r.op === 'DELETE') lines.push('حذف الحساب');
    if (r.op === 'UPDATE') {
      if ('password_hash' in n) lines.push('تغيير كلمة السر');
      if ('is_active' in n) lines.push(n.is_active ? 'تفعيل الحساب' : 'تعطيل الحساب');
      if ('username' in n) lines.push(`اليوزر: ${val(o.username)} ← ${val(n.username)}`);
    }
  } else if (r.table_name === 'products') {
    const p = ctx.prods[r.row_id];
    title = p ? `منتج ${p.product_no} · ${p.name_ar || p.name}` : `منتج ${String(r.row_id).slice(0, 8)}`;
    if ('price' in n) lines.push(`السعر: ${val(o.price)} ← ${val(n.price)}`);
    if ('sale_price' in n) lines.push(`بعد التخفيض: ${val(o.sale_price)} ← ${val(n.sale_price)}`);
    if ('status' in n) lines.push(`الحالة: ${val(o.status)} ← ${val(n.status)}`);
    if ('name' in n) lines.push(`الاسم: ${val(o.name)} ← ${val(n.name)}`);
    if ('name_ar' in n) lines.push(`الاسم العربي: ${val(o.name_ar)} ← ${val(n.name_ar)}`);
  }

  if (lines.length === 0) lines.push(JSON.stringify(r.new_data || r.old_data || {}));
  return { title, lines };
}

export default async function AuditPage({ searchParams }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const sp = await searchParams;
  const rawG = Array.isArray(sp?.g) ? sp.g[0] : sp?.g;
  const group = GROUPS.find((g) => g[0] === rawG) || GROUPS[0];

  let q = supabaseAdmin
    .from('audit_log')
    .select('id, at, table_name, op, row_id, old_data, new_data')
    .order('at', { ascending: false })
    .order('id', { ascending: false })
    .limit(150);
  if (group[2]) q = q.in('table_name', group[2]);
  const { data, error } = await q;
  const rows = data ?? [];

  const ids = (t) => [...new Set(rows.filter((r) => r.table_name === t && r.row_id).map((r) => r.row_id))].slice(0, 100);
  const subIds = ids('sub_orders');
  const prodIds = ids('products');
  const saccIds = ids('store_accounts');

  const [subsRes, prodRes, saccRes, couriersRes, storesRes] = await Promise.all([
    subIds.length
      ? supabaseAdmin
          .from('sub_orders')
          .select('id, part_no, parts_total, orders(order_no), stores(name, name_ar)')
          .in('id', subIds)
      : Promise.resolve({ data: [] }),
    prodIds.length
      ? supabaseAdmin.from('products').select('id, product_no, name, name_ar').in('id', prodIds)
      : Promise.resolve({ data: [] }),
    saccIds.length
      ? supabaseAdmin.from('store_accounts').select('id, username, stores(name, name_ar)').in('id', saccIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin.from('courier_accounts').select('id, name, username'),
    supabaseAdmin.from('stores').select('id, name, name_ar'),
  ]);

  const toMap = (res) => {
    const m = {};
    (res.data ?? []).forEach((x) => {
      m[x.id] = x;
    });
    return m;
  };
  const ctx = {
    subs: toMap(subsRes),
    prods: toMap(prodRes),
    saccs: toMap(saccRes),
    couriers: toMap(couriersRes),
    stores: toMap(storesRes),
  };

  const chip = (active) => ({
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    border: `1px solid ${active ? '#111' : '#ddd'}`,
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#111',
  });

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>سجل التدقيق</h1>
      <div style={{ fontSize: 12, color: '#777', marginBottom: 10, lineHeight: 1.8 }}>
        بيسجّل التغييرات الحساسة تلقائياً (شو تغيّر ومتى). ما بيسجّل مين اللي عمل التغيير.
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {GROUPS.map(([k, label]) => (
          <Link key={k} href={`/admin/audit?g=${k}`} style={chip(k === group[0])}>
            {label}
          </Link>
        ))}
      </div>

      {error && <p style={{ color: '#b00' }}>تعذّر التحميل. تأكد إنك نفّذت أمر القاعدة.</p>}
      {!error && rows.length === 0 && <p style={{ color: '#777' }}>ما في سجلات لسا.</p>}

      {rows.map((r) => {
        const { title, lines } = describe(r, ctx);
        const d = toDate(r.at);
        return (
          <div key={r.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 10, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
              <b style={{ color: OP_COLOR[r.op] || '#111' }}>{OP_AR[r.op] || r.op}</b>
              <span style={{ color: '#777' }}>
                {d ? d.toLocaleString('ar-JO', { timeZone: 'Asia/Amman', dateStyle: 'short', timeStyle: 'short' }) : ''}
              </span>
            </div>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: 14 }}>{title}</div>
            {lines.map((l, i) => (
              <div key={i} style={{ fontSize: 13, color: '#444', marginTop: 3, lineHeight: 1.7 }}>
                {l}
              </div>
            ))}
          </div>
        );
      })}
    </main>
  );
}
