self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data ? event.data.json() : null;
    } catch {
      try {
        return event.data ? JSON.parse(event.data.text()) : null;
      } catch {
        return null;
      }
    }
  })();

  const type = data && typeof data.type === 'string' ? data.type : 'NOTIFICATION';
  const bookingId = data && typeof data.bookingId === 'string' ? data.bookingId : '';
  const url = data && typeof data.url === 'string' ? data.url : '/';

  let title = 'Champ';
  let body = 'You have an update.';
  if (type === 'REMINDER_24H') {
    title = 'Booking reminder';
    body = 'Your training starts in about 24 hours.';
  } else if (type === 'FIGHTER_NEW_BOOKING') {
    title = 'New booking';
    body = 'A new booking was created for you.';
  }

  const tag = bookingId ? `${type}:${bookingId}` : type;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of allClients) {
        if ('focus' in c) {
          await c.focus();
          if ('navigate' in c) await c.navigate(url);
          return;
        }
      }
      await clients.openWindow(url);
    })(),
  );
});

