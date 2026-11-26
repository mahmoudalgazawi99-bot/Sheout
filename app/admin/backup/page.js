import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { TABLES, PART } from '@/lib/backuptables';

export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const counts = await Promise.all(
    TABLES.map(async ([t]) => {
      const { count, error } = await supabaseAdmin.from(t).select('*', { count: 'exact', head: true });
      return error ? null : count || 0;
    })
  );

  const pill = {
    display: 'inline-block',
    border: '1px solid #ddd',
    borderRadius: 999,
    padding: '5px 12px',
    fontSize: 13,
    color: '#111',
    textDecoration: 'none',
    background: '#fff',
  };

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <Link href="/admin" style={{ color: '#111', textDecoration: 'none', fontSize: 14 }}>
        → الرئيسية
      </Link>
      <h1>نسخة البيانات</h1>

      <div style={{ background: '#fff7e0', border: '1px solid #e2c36b', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 1.9 }}>
        <b>مهم:</b> هاي نسخة يدوية احتياطية للبيانات (JSON)، <b>مش بديل</b> عن نسخ Supabase التلقائية بالخطة المدفوعة.
        <br />• فيها بيانات شخصية (أسماء وهواتف وعناوين): خزّنها بمكان آمن ولا تشاركها.
        <br />• ما فيها: صور المنتجات والفيديو (التخزين)، وحسابات الدخول وكلمات السر.
        <br />• نزّلها أسبوعياً على الأقل، واحتفظ بآخر 4 نسخ.
      </div>

      {TABLES.map(([t, label], i) => {
        const count = counts[i];
        const parts = count ? Math.min(20, Math.ceil(count / PART)) : 0;
        return (
          <div key={t} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginTop: 10, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <b>{label}</b>
              <span style={{ color: '#777', fontSize: 13 }}>{count === null ? 'غير متوفر' : `${count} صف`}</span>
            </div>
            {parts > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {Array.from({ length: parts }, (_, p) => (
                  <a key={p} href={`/api/admin/backup?table=${t}&part=${p + 1}`} style={pill}>
                    {parts > 1 ? `تنزيل الجزء ${p + 1}` : 'تنزيل'}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}
