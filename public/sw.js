// WorkSyne Service Worker — Web Push Handler
// v2

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Handle incoming push notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'WorkSyne', body: event.data.text() }; }

  const title   = data.title   || 'WorkSyne';
  const options = {
    body:             data.body   || '',
    icon:             data.icon   || '/favicon.svg',
    badge:            data.badge  || '/favicon.svg',
    tag:              data.tag    || 'worksyne-notification',
    renotify:         true,
    requireInteraction: false,
    vibrate:          [200, 100, 200],
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open/focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // If app already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
