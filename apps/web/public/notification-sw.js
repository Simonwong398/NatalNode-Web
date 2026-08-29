const NOTIFICATION_TITLE_MAXIMUM_LENGTH = 80;
const NOTIFICATION_BODY_MAXIMUM_LENGTH = 160;
const NOTIFICATION_PATH_MAXIMUM_LENGTH = 256;
const GENERIC_NOTIFICATION_TITLE = 'NatalNode';
const GENERIC_NOTIFICATION_BODY = 'Open NatalNode to view the update.';
const SAFE_NOTIFICATION_FALLBACK_PATH = '/';
const SAFE_NOTIFICATION_ROUTE_PREFIXES = [
  '/account',
  '/about',
  '/learn',
  '/methodology',
  '/tools',
  '/vault'
];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyAllowedKeys(value, allowedKeys) {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function hasSafeText(value, maximumLength) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Array.from(value).length <= maximumLength &&
    !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)
  );
}

function isSafeNotificationPath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    Array.from(value).length > NOTIFICATION_PATH_MAXIMUM_LENGTH ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('?') ||
    value.includes('#') ||
    value.includes('\\') ||
    /[\u0000-\u001F\u007F]/u.test(value) ||
    /(?:^|\/)\.{1,2}(?:\/|$)/u.test(value)
  ) {
    return false;
  }

  let decodedValue;

  try {
    decodedValue = decodeURIComponent(value);
  } catch (_error) {
    return false;
  }

  if (
    decodedValue.startsWith('//') ||
    decodedValue.includes('?') ||
    decodedValue.includes('#') ||
    decodedValue.includes('\\') ||
    /(?:^|\/)\.{1,2}(?:\/|$)/u.test(decodedValue)
  ) {
    return false;
  }

  let url;

  try {
    url = new URL(value, self.location.origin);
  } catch (_error) {
    return false;
  }

  if (url.origin !== self.location.origin || url.search || url.hash) {
    return false;
  }

  return (
    url.pathname === '/' ||
    SAFE_NOTIFICATION_ROUTE_PREFIXES.some(
      (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
    )
  );
}

function normalizeNotificationPath(value) {
  return isSafeNotificationPath(value)
    ? value
    : SAFE_NOTIFICATION_FALLBACK_PATH;
}

function parseNotificationPayload(value) {
  if (
    !isRecord(value) ||
    !hasOnlyAllowedKeys(value, ['version', 'title', 'body', 'path']) ||
    value.version !== 1 ||
    !hasSafeText(value.title, NOTIFICATION_TITLE_MAXIMUM_LENGTH) ||
    !hasSafeText(value.body, NOTIFICATION_BODY_MAXIMUM_LENGTH)
  ) {
    return null;
  }

  if (value.path !== undefined && !isSafeNotificationPath(value.path)) {
    return null;
  }

  return {
    title: value.title,
    body: value.body,
    path: normalizeNotificationPath(value.path)
  };
}

function genericNotification() {
  return {
    title: GENERIC_NOTIFICATION_TITLE,
    body: GENERIC_NOTIFICATION_BODY,
    path: SAFE_NOTIFICATION_FALLBACK_PATH
  };
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload = null;

    try {
      payload = parseNotificationPayload(
        event.data === null ? null : event.data.json()
      );
    } catch (_error) {
      payload = null;
    }

    const notification = payload ?? genericNotification();

    try {
      await self.registration.showNotification(notification.title, {
        body: notification.body,
        data: { path: notification.path }
      });
    } catch (_error) {
      // A closed or unavailable notification surface must not escape the worker.
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = normalizeNotificationPath(event.notification?.data?.path);

  event.waitUntil((async () => {
    try {
      const targetUrl = new URL(path, self.location.origin).href;
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      const existingClient = clients.find((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch (_error) {
          return false;
        }
      });

      if (existingClient !== undefined) {
        try {
          await existingClient.focus();
          if (existingClient.url !== targetUrl && typeof existingClient.navigate === 'function') {
            await existingClient.navigate(path);
          }
          return;
        } catch (_error) {
          // Fall through to a same-origin new window when focus/navigation fails.
        }
      }

    } catch (_error) {
      // A browser lifecycle failure must not escape the worker.
    }

    try {
      await self.clients.openWindow(path);
    } catch (_error) {
      // Notification clicks remain harmless when a window cannot be opened.
    }
  })());
});
