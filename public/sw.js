/*
 * AKPsi Omicron Tau - service worker.
 *
 * Two jobs:
 *   1) Offline shell: cache the app shell + visited pages so the site opens
 *      without a connection. Strategy is NETWORK-FIRST for everything (with a
 *      cached fallback) so the SW can never serve a stale JS chunk that
 *      mismatches the current HTML - that mismatch crashes the app (missing
 *      "module factory") and looks like vanished images + dead navigation.
 *   2) Push notifications: show pushes and focus the app on click. These
 *      handlers stay dormant until a brother subscribes (see src/lib/push.ts)
 *      and the Supabase send-push function is live.
 *
 * Bump CACHE_VERSION on any release to force old caches out.
 */
const CACHE_VERSION = "akpsi-v9";
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

  // Network-first for EVERYTHING same-origin: when online we always serve the
  // freshly-built HTML/JS/CSS/assets (so a cached chunk can never mismatch the
  // live HTML and crash the app), caching each success for offline use. Only
  // when the network fails do we fall back to the cache, then the offline page.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match("/offline/");
          return Response.error();
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
