export function GET() {
  const manifest = {
    name: 'Sheout Stores',
    short_name: 'Sheout',
    description: 'تطبيق المحلات',
    start_url: '/store',
    scope: '/store',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#141414',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/api/store/icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/store/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
