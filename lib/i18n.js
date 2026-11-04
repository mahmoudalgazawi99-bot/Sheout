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
