import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/adminauth';
import { dayKey } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export default async function ExportPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const today = dayKey(new Date());
  const ago = (n) => dayKey(new Date(Date.now() - n * 86400000));

  const pill = {
    display: 'inline-block',
    border: '1px solid #ddd',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 13,
    color: '#111',
    textDecoration: 'none',
    background: '#fff',
  };
  const field = { padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 16 };

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>تصدير الطلبات (CSV)</h1>

      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.9 }}>
        ملف طلب لكل صف، جاهز تفتحه بـ Numbers أو Google Sheets أو Excel. فيه المبالغ، المحافظة والمنطقة، عدد الطرود والمحلات
        والقطع، التأكيد، وأوقات كل مرحلة بالدقائق. <b>بدون أسماء أو هواتف أو عناوين.</b>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        <a style={pill} href={`/api/admin/export/orders?from=${ago(7)}&to=${today}`}>
          آخر 7 أيام
        </a>
        <a style={pill} href={`/api/admin/export/orders?from=${ago(30)}&to=${today}`}>
          آخر 30 يوم
        </a>
        <a style={pill} href={`/api/admin/export/orders?from=2020-01-01&to=${today}`}>
          الكل
        </a>
      </div>

      <form method="GET" action="/api/admin/export/orders" style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>فترة محددة</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>
            من <input type="date" name="from" defaultValue={ago(30)} style={field} />
          </label>
          <label style={{ fontSize: 13 }}>
            إلى <input type="date" name="to" defaultValue={today} style={field} />
          </label>
        </div>
        <button
          type="submit"
          style={{ marginTop: 10, padding: '10px 20px', borderRadius: 999, border: 'none', background: '#111', color: '#fff', fontWeight: 600 }}
        >
          تنزيل CSV
        </button>
      </form>

      <p style={{ fontSize: 12, color: '#777', lineHeight: 1.9, marginTop: 14 }}>
        العمولة والإيراد تقديريين (عمولة 15% على الطرود الموصّلة + رسوم التوصيل). تكاليف الاستلام والمستودع والتوصيل
        بتضيفها إنت بالجدول لتحسب هامش المساهمة لكل طلب.
      </p>
    </main>
  );
}
