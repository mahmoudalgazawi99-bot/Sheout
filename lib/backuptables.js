export const PART = 2000;

// [اسم الجدول, الاسم بالعربي, عمود الترتيب]
export const TABLES = [
  ['stores', 'المحلات', 'id'],
  ['products', 'المنتجات', 'id'],
  ['product_variants', 'مخزون المقاسات', 'id'],
  ['customers', 'العملاء', 'id'],
  ['orders', 'الطلبات', 'id'],
  ['sub_orders', 'طرود الطلبات', 'id'],
  ['order_items', 'بنود الطلبات', 'id'],
  ['order_aliases', 'الطلبات المدموجة', 'old_id'],
  ['order_issues', 'بلاغات المحلات', 'id'],
  ['complaints', 'شكاوى العملاء', 'id'],
  ['product_reviews', 'التقييمات', 'id'],
  ['customer_notes', 'ملاحظات العملاء', 'id'],
  ['cash_handovers', 'استلام النقد', 'id'],
  ['store_payouts', 'دفعات المحلات', 'id'],
  ['store_agreements', 'موافقات الاتفاقية', 'id'],
  ['store_messages', 'محادثات المحلات', 'id'],
  ['audit_log', 'سجل التدقيق', 'id'],
];
