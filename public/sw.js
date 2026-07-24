/*
 * AKPsi Omicron Tau - service worker.
 *
 * Two jobs:
 *   1) Offline shell: cache the app shell + visited pages so the site opens
 *      without a connection (network-first for pages, cache-first for assets).
 *   2) Push notifications: show pushes and focus the app on click. These
 *      handlers stay dormant until a brother subscribes (see src/lib/push.ts)
 *      and the Supabase send-push function is live.
 *
 * Bump CACHE_VERSION whenever the precache list changes to force an update.
 */
const CACHE_VERSION = "akpsi-v1";
const PRECACHE = [
  "/",
  "/offline/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/akpsi-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (Supabase, Google, IG) pass through

  // Page navigations: network-first, fall back to cache, then the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline/"))
        )
    );
    return;
  }

  // Static assets: cache-first, then network (and cache the result).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});

// --- Push notifications (dormant until a subscription + sender exist) ---
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "AKΨ Omicron Tau", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "AKΨ Omicron Tau";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    tag: payload.tag || "akpsi",
    data: { url: payload.url || "/portal/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/portal/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
