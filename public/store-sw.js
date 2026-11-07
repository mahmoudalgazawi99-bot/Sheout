self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const isAdminTarget = String(data.url || '').startsWith('/admin');
  const icon = isAdminTarget ? '/api/store/icon?size=192&variant=admin' : '/api/store/icon?size=192';

  const options = {
    body: data.body || '',
    icon: icon,
    badge: icon,
    data: { url: data.url || '/store' },
    dir: 'rtl',
    lang: 'ar',
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Sheout', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || '/store';
  const target = new URL(raw, self.location.origin);
  const section = self.location.origin + '/' + target.pathname.split('/')[1];

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (list) => {
      for (const client of list) {
        if (client.url.startsWith(section) && 'focus' in client) {
          try {
            await client.focus();
            if (client.url !== target.href && 'navigate' in client) {
              await client.navigate(target.href);
            }
          } catch (e) {}
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(target.href);
      }
    })
  );
});
