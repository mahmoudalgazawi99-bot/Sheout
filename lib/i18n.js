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
  },
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
