import { NextResponse } from 'next/server';
import { getStoreSession } from '@/lib/storeauth';
import { sendToAccounts, isPushConfigured } from '@/lib/push';

export async function POST() {
  const account = await getStoreSession();
  if (!account) return NextResponse.json({ error: 'انتهت الجلسة، سجّل الدخول من جديد' }, { status: 401 });

  if (!isPushConfigured()) {
    return NextResponse.json({ error: 'مفاتيح الإشعارات غير مهيأة بعد' }, { status: 500 });
  }

  const result = await sendToAccounts([account.id], {
    title: 'Sheout',
    body: 'إشعار تجريبي: الإشعارات تعمل بنجاح ✓',
    url: '/store',
  });

  if (result.sent === 0) {
    return NextResponse.json(
      {
        error:
          result.failed > 0
            ? 'تعذّر الإرسال للجهاز. أوقف الإشعارات وفعّلها من جديد'
            : 'ما في جهاز مفعّل. فعّل الإشعارات أولاً',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, sent: result.sent });
}
