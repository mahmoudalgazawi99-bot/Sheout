import { waLink } from '@/lib/contact';

export function waBase(phone) {
  return phone ? waLink(phone) : '';
}

export function orderMessages({ name, orderNo, total, address, link }) {
  const hi = `مرحباً ${name || ''} 👋\nمعك Sheout.`;
  const amount = `${Number(total).toFixed(2)} د.أ`;
  return [
    {
      key: 'confirm',
      label: 'تأكيد الطلب',
      text: `${hi}\nوصلنا طلبك رقم ${orderNo} بقيمة ${amount} (الدفع عند الاستلام).\nعنوان التوصيل: ${address}\nهل تؤكد الطلب؟ رد بكلمة "نعم" لنبدأ التجهيز.\nتابع طلبك من هون: ${link}`,
    },
    {
      key: 'status',
      label: 'حالة الطلب',
      text: `${hi}\nطلبك رقم ${orderNo} قيد التجهيز، وبنخبرك لما يصير جاهز للتوصيل.\nتابعه من هون: ${link}`,
    },
    {
      key: 'onway',
      label: 'بالطريق إليك',
      text: `${hi}\nطلبك رقم ${orderNo} بالطريق إليك 🛵\nالمبلغ المطلوب عند الاستلام: ${amount}.\nرجاءً كون جاهز لاستلامه 🙏`,
    },
    {
      key: 'problem',
      label: 'منتج غير متوفر',
      text: `${hi}\nبخصوص طلبك رقم ${orderNo}: للأسف أحد المنتجات صار غير متوفر.\nبتحب نقترح عليك بديل ولا نكمل الطلب بدونه؟`,
    },
    {
      key: 'custom',
      label: 'رسالة فاضية',
      text: `${hi}\n`,
    },
  ];
}
