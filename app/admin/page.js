import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { dayKey } from '@/lib/analytics';
import AdminLogout from '@/components/adminlogout';
import PushSetup from '@/components/pushsetup';
import AutoRefresh from '@/components/autorefresh';
import { MenuGrid, MenuCard, StatStrip } from '@/components/appmenu';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  if (!(await isAdmin())) redirect('/admin/login');

  const start = new Date(`${dayKey(new Date())}T00:00:00+03:00`).toISOString();
  const head = { count: 'exact', head: true };

  const [today, active, ready, issuesRes, complaintsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('id', head).gte('created_at', start),
    supabaseAdmin.from('orders').select('id', head).not('status', 'in', '(delivered,cancelled)'),
    supabaseAdmin.from('sub_orders').select('id', head).eq('status', 'ready'),
    supabaseAdmin.from('order_issues').select('id', head).eq('status', 'open'),
    supabaseAdmin.from('complaints').select('id', head).neq('status', 'resolved'),
  ]);

  const todayCount = today.count || 0;
  const activeCount = active.count || 0;
  const readyCount = ready.count || 0;
  const issueCount = issuesRes.error ? 0 : issuesRes.count || 0;
  const complaintCount = complaintsRes.error ? 0 : complaintsRes.count || 0;

  return (
    <main dir="rtl" lang="ar" style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <AutoRefresh seconds={30} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: theme.serif, letterSpacing: 4, fontSize: 26, margin: 0, fontWeight: 600 }}>
            SHEOUT
          </h1>
          <div style={{ fontSize: 12, color: theme.muted }}>لوحة الإدارة</div>
        </div>
        <AdminLogout />
      </div>

      <StatStrip
        items={[
          { label: 'طلبات اليوم', value: todayCount },
          { label: 'قيد التنفيذ', value: activeCount },
          { label: 'جاهزة للاستلام', value: readyCount, dark: readyCount > 0 },
        ]}
      />

      <MenuGrid>
        <MenuCard href="/admin/orders" icon="📦" title="الطلبات" sub="الطلبات الحالية والبحث" badge={activeCount} />
        <MenuCard href="/admin/analytics" icon="📊" title="التحليلات" sub="المبيعات والأداء" />
        <MenuCard
          href="/admin/issues"
          icon="⚠️"
          title="البلاغات"
          sub="بلاغات المحلات"
          badge={issueCount}
          alert={issueCount > 0}
        />
        <MenuCard
          href="/admin/complaints"
          icon="💬"
          title="شكاوى العملاء"
          sub="خدمة ما بعد البيع"
          badge={complaintCount}
          alert={complaintCount > 0}
        />
        <MenuCard href="/admin/customers" icon="👤" title="العملاء" sub="بروفايل وملاحظات" />
        <MenuCard href="/admin/reviews" icon="⭐" title="تعليقات المنتجات" sub="إظهار وإخفاء" />
        <MenuCard href="/admin/couriers" icon="🛵" title="المناديب" sub="الحسابات والتفعيل" />
        <MenuCard href="/admin/stores" icon="🏪" title="حسابات المحلات" sub="يوزر وكلمة سر لكل محل" />
      </MenuGrid>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>إعدادات الإشعارات</summary>
        <PushSetup
          publicKey={process.env.VAPID_PUBLIC_KEY || ''}
          apiBase="/api/admin/push"
          swUrl="/store-sw.js"
          scope="/admin"
        />
      </details>
    </main>
  );
}
