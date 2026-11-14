import { normPhone, toDate } from '@/lib/analytics';

export function waLink(phone) {
  let d = normPhone(phone);
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '962' + d.slice(1);
  return d ? `https://wa.me/${d}` : '';
}

export function ago(v) {
  const d = toDate(v);
  if (!d) return '';
  const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  return h < 24 ? `قبل ${h} ساعة` : `قبل ${Math.floor(h / 24)} يوم`;
}

export function dateAr(v) {
  const d = toDate(v);
  if (!d) return '';
  return d.toLocaleDateString('ar-JO', { timeZone: 'Asia/Amman', dateStyle: 'medium' });
}
