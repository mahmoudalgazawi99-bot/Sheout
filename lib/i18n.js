export const DEFAULT_LANG = 'ar';

const dict = {
  ar: {
    tagline: 'أزياء من أفضل متاجر الأردن',
    search: 'ابحث عن منتجات أو متاجر...',
    featuredStores: 'متاجر مميزة',
    newArrivals: 'وصل حديثاً',
    cart: 'السلة',
    loadError: 'تعذّر تحميل بعض البيانات. حاول مرة أخرى.',
    Women: 'نسائي',
    Men: 'رجالي',
    Kids: 'أطفال',
    Shoes: 'أحذية',
    Sports: 'رياضة',
    Accessories: 'إكسسوارات',
    backTo: 'العودة إلى SHEOUT',
    storeNotFound: 'المتجر غير موجود',
    productNotFound: 'المنتج غير موجود',
    hours: 'ساعات العمل',
    phone: 'الهاتف',
    products: 'المنتجات',
    noProducts: 'لا توجد منتجات بعد.',
    inStock: 'متوفر',
    outOfStock: 'غير متوفر',
    sizes: 'المقاسات',
    colors: 'الألوان',
    addToCart: 'أضف إلى السلة',
    chooseSize: 'الرجاء اختيار المقاس',
    chooseColor: 'الرجاء اختيار اللون',
    addedToCart: 'تمت الإضافة إلى السلة.',
    viewCart: 'عرض السلة',
    resultsFor: 'نتائج البحث عن',
    allProducts: 'كل المنتجات',
    stores: 'المتاجر',
    noResults: 'لا توجد نتائج. جرّب بحثاً أو قسماً آخر.',
    yourCart: 'سلتك',
    cartEmpty: 'سلتك فارغة.',
    remove: 'حذف',
    storeSubtotal: 'مجموع المتجر',
    total: 'المجموع',
    items: 'المنتجات',
    delivery: 'التوصيل',
    deliveryNote: 'تُضاف رسوم التوصيل عند إتمام الطلب',
    checkout: 'إتمام الطلب',
    backToCart: 'العودة إلى السلة',
    fullName: 'الاسم الكامل',
    address: 'عنوان التوصيل',
    notes: 'ملاحظات (اختياري)',
    paymentCod: 'الدفع: عند الاستلام',
    placeOrder: 'تأكيد الطلب',
    placing: 'جارٍ إرسال الطلب...',
    thankYou: 'شكراً لك!',
    name: 'الاسم',
    status: 'الحالة',
    continueShopping: 'متابعة التسوق',
    orderNotFound: 'الطلب غير موجود',
    errFill: 'الرجاء تعبئة الاسم والهاتف والعنوان',
    errGeneric: 'حدث خطأ ما، حاول مرة أخرى',
    errNetwork: 'مشكلة في الاتصال، حاول مرة أخرى',
    errEmptyCart: 'سلتك فارغة',
    errInvalidItem: 'يوجد منتج غير صالح في السلة',
    errUnavailable: 'أحد المنتجات في سلتك لم يعد متوفراً',
    errStock: 'الكمية غير كافية للمنتج',
    errPlace: 'تعذّر إتمام طلبك، حاول مرة أخرى',
  },
  en: {
    tagline: "Fashion from Jordan's best stores",
    search: 'Search products, stores...',
    featuredStores: 'Featured Stores',
    newArrivals: 'New Arrivals',
    cart: 'Cart',
    loadError: 'Could not load some data. Please try again.',
    Women: 'Women',
    Men: 'Men',
    Kids: 'Kids',
    Shoes: 'Shoes',
    Sports: 'Sports',
    Accessories: 'Accessories',
    backTo: 'Back to SHEOUT',
    storeNotFound: 'Store not found',
    productNotFound: 'Product not found',
    hours: 'Hours',
    phone: 'Phone',
    products: 'Products',
    noProducts: 'No products yet.',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    sizes: 'Sizes',
    colors: 'Colors',
    addToCart: 'Add to cart',
    chooseSize: 'Please choose a size',
    chooseColor: 'Please choose a color',
    addedToCart: 'Added to cart.',
    viewCart: 'View cart',
    resultsFor: 'Results for',
    allProducts: 'All products',
    stores: 'Stores',
    noResults: 'No results found. Try a different search or category.',
    yourCart: 'Your Cart',
    cartEmpty: 'Your cart is empty.',
    remove: 'Remove',
    storeSubtotal: 'Store subtotal',
    total: 'Total',
    items: 'Items',
    delivery: 'Delivery',
    deliveryNote: 'delivery fee added at checkout',
    checkout: 'Checkout',
    backToCart: 'Back to cart',
    fullName: 'Full name',
    address: 'Delivery address',
    notes: 'Notes (optional)',
    paymentCod: 'Payment: cash on delivery',
    placeOrder: 'Place order',
    placing: 'Placing order...',
    thankYou: 'Thank you!',
    name: 'Name',
    status: 'Status',
    continueShopping: 'Continue shopping',
    orderNotFound: 'Order not found',
    errFill: 'Please fill in name, phone and address',
    errGeneric: 'Something went wrong',
    errNetwork: 'Network error, please try again',
    errEmptyCart: 'Your cart is empty',
    errInvalidItem: 'Invalid cart item',
    errUnavailable: 'A product in your cart is no longer available',
    errStock: 'Not enough stock for',
    errPlace: 'Could not place your order',
  },
};

const colorsAr = {
  White: 'أبيض',
  Black: 'أسود',
  Gray: 'رمادي',
  Grey: 'رمادي',
  Blue: 'أزرق',
  Red: 'أحمر',
  Green: 'أخضر',
  Brown: 'بني',
  Beige: 'بيج',
  Purple: 'بنفسجي',
  Pink: 'وردي',
  Navy: 'كحلي',
  Yellow: 'أصفر',
  Orange: 'برتقالي',
  Olive: 'زيتي',
  Khaki: 'كاكي',
};

const statusAr = {
  new: 'جديد',
  processing: 'قيد التجهيز',
  confirmed: 'مؤكد',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export function t(lang, key) {
  return (dict[lang] && dict[lang][key]) || dict.en[key] || key;
}

export function money(lang, v) {
  const n = Number(v).toFixed(2);
  return lang === 'ar' ? `${n} د.أ` : `${n} JD`;
}

export function pick(lang, en, ar) {
  return lang === 'ar' && ar ? ar : en;
}

export function colorLabel(lang, c) {
  if (lang !== 'ar') return c;
  return colorsAr[c] || c;
}

export function sizeLabel(lang, s) {
  if (lang !== 'ar') return s;
  if (s === 'One Size') return 'مقاس واحد';
  const m = /^(\d+)Y$/.exec(String(s));
  if (m) return `${m[1]} سنوات`;
  return s;
}

export function statusLabel(lang, s) {
  if (lang !== 'ar') return s;
  return statusAr[s] || s;
}

export function storesLine(lang, n) {
  if (lang === 'ar') {
    return n === 1 ? 'متجر واحد في هذا الطلب' : `${n} متاجر في هذا الطلب`;
  }
  return `${n} ${n === 1 ? 'store' : 'stores'} in this order`;
}

export function translateError(lang, msg) {
  const m = String(msg || '');
  if (lang !== 'ar') return m || t(lang, 'errGeneric');
  if (m.startsWith('Please fill in')) return t(lang, 'errFill');
  if (m === 'Your cart is empty') return t(lang, 'errEmptyCart');
  if (m === 'Invalid cart item') return t(lang, 'errInvalidItem');
  if (m.startsWith('A product in your cart')) return t(lang, 'errUnavailable');
  if (m.startsWith('Not enough stock for')) {
    return `${t(lang, 'errStock')} ${m.replace('Not enough stock for', '').trim()}`;
  }
  if (m.startsWith('Could not')) return t(lang, 'errPlace');
  return t(lang, 'errGeneric');
}
