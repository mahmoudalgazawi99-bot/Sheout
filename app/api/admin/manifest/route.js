export function GET() {
  const manifest = {
    name: 'Sheout Admin',
    short_name: 'Sheout Admin',
    description: 'لوحة إدارة Sheout',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    background_color: '#faf6ef',
    theme_color: '#141414',
    lang: 'ar',
    icons: [
      { src: '/api/store/icon?size=192&variant=admin', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/store/icon?size=512&variant=admin', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
