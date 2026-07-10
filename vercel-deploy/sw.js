// KILL SWITCH SW v8 — clears ALL caches and unregisters
const CACHE_NAME = 'pradip-homoe-v8-kill';

self.addEventListener('install', e => {
  self.skipWaiting();
  // Clear all caches on install
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      // Delete ALL caches (not just non-matching ones)
      return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
  // Unregister this SW after cleanup
  self.registration.unregister();
});

// For ALL requests: just pass through to network (no caching at all)
self.addEventListener('fetch', e => {
  // Don't intercept any requests — let browser handle everything normally
  return;
});
