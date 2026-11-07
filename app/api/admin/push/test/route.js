import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminauth';
import { sendToAdmins, isPushConfigured } from '@/lib/push';

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'انتهت الجلسة، سجّل الدخول من جديد' }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ error: 'مفاتيح الإشعارات غير مهيأة بعد' }, { status: 500 });
  }

  const result = await sendToAdmins({
    title: 'Sheout Admin',
    body: 'إشعار تجريبي: إشعارات الأدمن تعمل بنجاح ✓',
    url: '/admin',
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
