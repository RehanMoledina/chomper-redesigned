self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have tasks waiting!',
      icon: '/chomper-icon.png',
      badge: '/chomper-badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/',
      },
      actions: [
        { action: 'open', title: 'View Tasks' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      requireInteraction: false,
      tag: 'chomper-daily-reminder',
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Chomper', options)
    );
  } catch (error) {
    console.error('Error parsing push data:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(function(focusedClient) {
              if (focusedClient.navigate) {
                return focusedClient.navigate(urlToOpen);
              }
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});
