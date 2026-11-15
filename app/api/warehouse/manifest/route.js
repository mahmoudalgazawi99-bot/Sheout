export function GET() {
  const manifest = {
    name: 'Sheout Warehouse',
    short_name: 'Sheout WH',
    description: 'تطبيق مستودع Sheout',
    start_url: '/warehouse',
    scope: '/warehouse',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#141414',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/api/store/icon?size=192&variant=warehouse', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/store/icon?size=512&variant=warehouse', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
