export default function manifest() {
  return {
    name: 'Sheout',
    short_name: 'Sheout',
    description: 'أزياء عصرية من الأردن',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#faf6ef',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/api/store/icon?size=192&variant=shop', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/store/icon?size=512&variant=shop', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
