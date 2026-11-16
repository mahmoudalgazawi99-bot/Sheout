import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminauth';
import { loadMergeGroups } from '@/lib/mergegroups';
import { toDate } from '@/lib/analytics';
import { money } from '@/lib/i18n';
import MergeButton from '@/components/mergebutton';

export const dynamic = 'force-dynamic';

const jd = (v) => money('ar', v);
const norm = (s) => String(s || '').trim().toLowerCase();

function timeOf(v) {
  const d = toDate(v);
  return d ? d.toLocaleTimeString('ar-JO', { timeZone: 'Asia/Amman', hour: '2-digit', minute: '2-digit' }) : '';
}

export default async function MergePage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const groups = await loadMergeGroups();

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>دمج الطلبات</h1>
      <p style={{ color: '#777', fontSize: 13, lineHeight: 1.8 }}>
        طلبات مفتوحة لنفس الزبون ونفس اليوم، ما انجهّزت وما استلمها مندوب توصيل. الدمج بيجمعهم بتوصيلة وحدة برسوم
        توصيل وحدة، وبيحافظ على رقم أقدم طلب.
      </p>

      {groups.length === 0 && <p style={{ color: '#177a3c' }}>ما في طلبات قابلة للدمج حالياً.</p>}

      {groups.map((g) => {
        const [primary, ...others] = g.orders;
        const saved = others.reduce((s, o) => s + (Number(o.delivery_fee) || 0), 0);
        const sameAddress = g.orders.every((o) => norm(o.address) === norm(primary.address));

        return (
          <div key={g.key} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 14, background: '#fff' }}>
            <div style={{ fontWeight: 700 }}>
              {g.customer.name} · <bdi dir="ltr">{g.customer.phone}</bdi>
            </div>
            <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
              عضو <bdi dir="ltr">{g.customer.member_no}</bdi> · <bdi dir="ltr">{g.day}</bdi>
            </div>

            {g.orders.map((o, i) => (
              <div key={o.id} style={{ borderTop: '1px solid #f1f1f1', marginTop: 10, paddingTop: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ color: '#111' }}>
                    <bdi dir="ltr">#{o.order_no || String(o.id).slice(0, 8).toUpperCase()}</bdi>
                  </Link>
                  <span>
                    {i === 0 ? 'الأساسي · ' : ''}
                    {timeOf(o.created_at)} · {o.parcels} {o.parcels === 1 ? 'طرد' : 'طرود'} · {jd(o.total)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{o.address}</div>
              </div>
            ))}

            {!sameAddress && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff7e0', border: '1px solid #e2c36b', borderRadius: 10, fontSize: 13 }}>
                ⚠️ العناوين مختلفة. بيُعتمد عنوان الطلب الأساسي، تأكد مع الزبون قبل الدمج.
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 14 }}>
              بتوفّر رسوم توصيل: <b>{jd(saved)}</b>
            </div>
            <MergeButton primaryId={primary.id} otherIds={others.map((o) => o.id)} saved={saved.toFixed(2)} />
          </div>
        );
      })}
    </main>
  );
}
