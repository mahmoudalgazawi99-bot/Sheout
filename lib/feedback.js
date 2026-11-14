export const COMPLAINT_TYPES = [
  ['quality', 'جودة المنتج', 'Product quality'],
  ['size', 'المقاس أو اللون مش مطابق', 'Wrong size or color'],
  ['damaged', 'المنتج وصل تالف', 'Item arrived damaged'],
  ['wrong_item', 'استلمت منتج غلط', 'Received the wrong item'],
  ['packaging', 'التغليف', 'Packaging'],
  ['delivery', 'التوصيل أو المندوب', 'Delivery or courier'],
  ['other', 'سبب آخر', 'Other'],
];

export const COMPLAINT_STATUS = [
  ['open', 'جديدة', 'New'],
  ['in_progress', 'قيد المعالجة', 'In progress'],
  ['resolved', 'تم الحل', 'Resolved'],
];

export const NOTE_TAGS = [
  ['quality_picky', 'بيدقق بالجودة'],
  ['packaging_comment', 'علّق على التغليف'],
  ['friendly', 'متعاون'],
  ['satisfied', 'راضي'],
  ['complained', 'اشتكى'],
  ['hard_to_reach', 'صعب الوصول'],
  ['late_reply', 'ما بيرد بسرعة'],
  ['wants_early', 'بيحب التوصيل بدري'],
];

export function typeLabel(key, lang = 'ar') {
  const f = COMPLAINT_TYPES.find(([k]) => k === key);
  return f ? (lang === 'ar' ? f[1] : f[2]) : key;
}

export function complaintStatusLabel(key, lang = 'ar') {
  const f = COMPLAINT_STATUS.find(([k]) => k === key);
  return f ? (lang === 'ar' ? f[1] : f[2]) : key;
}

export function tagLabel(key) {
  const f = NOTE_TAGS.find(([k]) => k === key);
  return f ? f[1] : key;
}

export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
