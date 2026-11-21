/* global BUILD */
const PREFIX = 'hundred-pwa-';
const CACHE = PREFIX + BUILD.version;
const ASSETS = new Set(BUILD.assets);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Reject redirects / HTML responses (for example a protected preview login).
      await Promise.all(BUILD.assets.map(async path => {
        const response = await fetch(new Request(path, { cache: 'reload', redirect: 'error' }));
        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
          throw new Error(`Cannot cache app asset: ${path}`);
        }
        await cache.put(path, response);
      }));
      await cache.put('/', new Response(BUILD.shell, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      await cache.put('/manifest.webmanifest', new Response(BUILD.manifest, { headers: { 'Content-Type': 'application/manifest+json' } }));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
    // No skipWaiting: existing tabs keep a matching shell/runtime and unsaved forms.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Hash navigation shares this single document. Never intercept RSC/API/import requests.
  const navigation = request.mode === 'navigate' && url.pathname === '/';
  const asset = ASSETS.has(url.pathname) || (url.pathname === '/manifest.webmanifest' && !url.search);
  if (!navigation && !asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(navigation ? '/' : url.pathname);
    // Cache-first per build prevents new HTML from referring to uncached/new runtime chunks.
    // Missing entries may use the network, but arbitrary responses are never written here.
    return cached || fetch(request);
  })());
});
