const OFFLINE =
  '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sheout</title></head><body style="font-family:sans-serif;background:#faf6ef;color:#141414;text-align:center;padding:60px 20px"><h1 style="letter-spacing:4px">SHEOUT</h1><p>ما في اتصال بالإنترنت. جرّب مرة ثانية بعد شوي.</p><p dir="ltr" style="color:#777">No internet connection. Please try again.</p></body></html>';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode !== 'navigate') return;
  const path = new URL(req.url).pathname;
  if (/^\/(admin|store|courier|warehouse|api)(\/|$)/.test(path)) return;

  event.respondWith(
    fetch(req).catch(
      () =>
        new Response(OFFLINE, {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
    )
  );
});
