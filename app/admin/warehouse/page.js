import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { loadBoard } from '@/lib/warehousedata';
import { toDate } from '@/lib/analytics';
import { StatStrip } from '@/components/appmenu';

export const dynamic = 'force-dynamic';

const LATE = { ready: 30, carry: 45, wait: 20 };

function mins(v) {
  const d = toDate(v);
  return d ? Math.max(0, Math.round((Date.now() - d.getTime()) / 60000)) : 0;
}

const age = (m) => (m < 60 ? `${m} د` : `${Math.floor(m / 60)} س ${m % 60} د`);

const box = { border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 14, background: '#fff' };

function Row({ children, i }) {
  return (
    <div style={{ padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid #f1f1f1', fontSize: 14 }}>{children}</div>
  );
}

export default async function AdminWarehousePage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const { data: parcels } = await supabaseAdmin
    .from('sub_orders')
    .select(
      'id, status, part_no, parts_total, ready_at, picked_up_at, at_warehouse_at, picked_up_by, order_id, orders(order_no), stores(name, name_ar)'
    )
    .in('status', ['ready', 'picked_up'])
    .order('created_at', { ascending: true })
    .limit(300);

  const { data: packedOrders } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, packed_at, courier_id')
    .not('packed_at', 'is', null)
    .not('status', 'in', '(delivered,cancelled)')
    .order('packed_at', { ascending: true })
    .limit(100);

  const { data: couriers } = await supabaseAdmin.from('courier_accounts').select('id, name');
  const names = {};
  (couriers ?? []).forEach((c) => {
    names[c.id] = c.name;
  });

  const { toPack } = await loadBoard();

  const rows = parcels ?? [];
  const atStores = rows.filter((s) => s.status === 'ready');
  const withCouriers = rows.filter((s) => s.status === 'picked_up' && !s.at_warehouse_at);
  const atWarehouse = rows.filter((s) => s.status === 'picked_up' && s.at_warehouse_at);
  const packed = packedOrders ?? [];
  const waiting = packed.filter((o) => !o.courier_id);
  const out = packed.filter((o) => o.courier_id);

  const label = (s) => {
    const no = (s.orders && s.orders.order_no) || String(s.order_id).slice(0, 8).toUpperCase();
    const part = s.parts_total > 1 ? ` · طرد ${s.part_no} من ${s.parts_total}` : '';
    const store = s.stores ? s.stores.name_ar || s.stores.name : '';
    return { no, text: `${part} · ${store}` };
  };

  const alerts = [];
  atStores.forEach((s) => {
    const m = mins(s.ready_at);
    if (m >= LATE.ready) alerts.push({ id: s.id, orderId: s.order_id, m, text: `جاهز عند المحل ولسا ما انستلم${label(s).text}` , no: label(s).no });
  });
  withCouriers.forEach((s) => {
    const m = mins(s.picked_up_at);
    if (m >= LATE.carry) {
      alerts.push({
        id: s.id,
        orderId: s.order_id,
        m,
        text: `مع ${names[s.picked_up_by] || 'مندوب'} وما وصل المستودع${label(s).text}`,
        no: label(s).no,
      });
    }
  });
  waiting.forEach((o) => {
    const m = mins(o.packed_at);
    if (m >= LATE.wait) alerts.push({ id: o.id, orderId: o.id, m, text: 'مجهّز وما حدا استلمه للتوصيل', no: o.order_no || String(o.id).slice(0, 8).toUpperCase() });
  });
  alerts.sort((a, b) => b.m - a.m);

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>متابعة المستودع</h1>
      <div style={{ fontSize: 12, color: '#777' }}>بتتحدث تلقائياً.</div>

      <StatStrip
        items={[
          { label: 'عند المحلات', value: atStores.length },
          { label: 'مع المناديب', value: withCouriers.length },
          { label: 'بالمستودع', value: atWarehouse.length },
        ]}
      />
      <StatStrip
        items={[
          { label: 'للتجهيز', value: toPack.length, dark: toPack.length > 0 },
          { label: 'مجهّزة بانتظار مندوب', value: waiting.length },
          { label: 'خرجت للتوصيل', value: out.length },
        ]}
      />

      <h2 style={{ fontSize: 18, margin: '22px 0 10px' }}>تنبيهات تأخير ({alerts.length})</h2>
      <div style={{ ...box, borderColor: alerts.length > 0 ? '#e2b0b0' : '#eee' }}>
        {alerts.length === 0 && <div style={{ color: '#177a3c', fontSize: 14 }}>ما في تأخير.</div>}
        {alerts.map((a, i) => (
          <Row key={a.id} i={i}>
            <Link href={`/admin/orders/${a.orderId}`} style={{ color: '#111' }}>
              <bdi dir="ltr">#{a.no}</bdi>
            </Link>{' '}
            · {a.text} · <b style={{ color: '#b00' }}>{age(a.m)}</b>
          </Row>
        ))}
      </div>

      <h2 style={{ fontSize: 18, margin: '22px 0 10px' }}>مع المناديب ({withCouriers.length})</h2>
      <div style={box}>
        {withCouriers.length === 0 && <div style={{ color: '#777', fontSize: 14 }}>ما في شي.</div>}
        {withCouriers.map((s, i) => (
          <Row key={s.id} i={i}>
            <bdi dir="ltr">#{label(s).no}</bdi>
            {label(s).text} · مع <b>{names[s.picked_up_by] || 'مندوب'}</b> · {age(mins(s.picked_up_at))}
          </Row>
        ))}
      </div>

      <h2 style={{ fontSize: 18, margin: '22px 0 10px' }}>بالمستودع ({atWarehouse.length})</h2>
      <div style={box}>
        {atWarehouse.length === 0 && <div style={{ color: '#777', fontSize: 14 }}>ما في شي.</div>}
        {atWarehouse.map((s, i) => (
          <Row key={s.id} i={i}>
            <bdi dir="ltr">#{label(s).no}</bdi>
            {label(s).text} · وصل قبل {age(mins(s.at_warehouse_at))}
          </Row>
        ))}
      </div>

      <h2 style={{ fontSize: 18, margin: '22px 0 10px' }}>جاهزة للتجهيز ({toPack.length})</h2>
      <div style={box}>
        {toPack.length === 0 && <div style={{ color: '#777', fontSize: 14 }}>ما في شي.</div>}
        {toPack.map(({ o, active }, i) => (
          <Row key={o.id} i={i}>
            <Link href={`/admin/orders/${o.id}`} style={{ color: '#111' }}>
              <bdi dir="ltr">#{o.order_no || String(o.id).slice(0, 8).toUpperCase()}</bdi>
            </Link>{' '}
            · {active.length} {active.length === 1 ? 'طرد' : 'طرود'}
          </Row>
        ))}
      </div>

      <h2 style={{ fontSize: 18, margin: '22px 0 10px' }}>مجهّزة وخارجة ({packed.length})</h2>
      <div style={box}>
        {packed.length === 0 && <div style={{ color: '#777', fontSize: 14 }}>ما في شي.</div>}
        {packed.map((o, i) => (
          <Row key={o.id} i={i}>
            <Link href={`/admin/orders/${o.id}`} style={{ color: '#111' }}>
              <bdi dir="ltr">#{o.order_no || String(o.id).slice(0, 8).toUpperCase()}</bdi>
            </Link>{' '}
            ·{' '}
            {o.courier_id ? (
              <span style={{ color: '#177a3c' }}>خرج للتوصيل مع {names[o.courier_id] || 'مندوب'}</span>
            ) : (
              <span>بانتظار مندوب · {age(mins(o.packed_at))}</span>
            )}
          </Row>
        ))}
      </div>
    </main>
  );
}
