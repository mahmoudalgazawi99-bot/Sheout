import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminauth';
import { loadCash } from '@/lib/finance';
import { sendToCouriers, sendToAdmins } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const viaCron = !!secret && request.headers.get('authorization') === `Bearer ${secret}`;
  if (!viaCron && !(await isAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const couriers = await loadCash();
  let count = 0;
  let total = 0;

  for (const c of couriers) {
    if (c.role === 'warehouse' || !c.active || c.balance <= 0.009) continue;
    count += 1;
    total += c.balance;
    try {
      await sendToCouriers(
        {
          title: 'تذكير: رصيدك النقدي',
          body: `بذمّتك ${c.balance.toFixed(2)} د.أ. سلّمها للإدارة وسجّل التسليم.`,
          url: '/courier/cash',
        },
        c.id
      );
    } catch {}
  }

  if (count > 0) {
    try {
      await sendToAdmins({
        title: 'نقد غير مسلّم عند المناديب',
        body: `${count} مندوب · المجموع ${total.toFixed(2)} د.أ`,
        url: '/admin/settlements',
      });
    } catch {}
  }

  return NextResponse.json({ ok: true, couriers: count, total: Math.round(total * 100) / 100 });
}
