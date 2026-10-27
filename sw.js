// Service worker: lets the game install as an app and run offline.
// It caches the page plus every script, stylesheet and icon the page links to (read from index.html,
// so new files are picked up automatically). The page registers it as sw.js?v=N, so each release
// installs a fresh cache and the page shows a "new version" banner.
const VERSION = new URL(self.location).searchParams.get('v') || '0';
const CACHE = 'summoner-hellbound-v' + VERSION;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const html = await (await fetch('index.html', { cache: 'no-store' })).text();
    const linked = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)].map(m => m[1]).filter(u => !/^https?:/.test(u));
    await cache.addAll([...new Set([...CORE, ...linked])]);
  })());
});
self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('summoner-hellbound-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', ev => { if (ev.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', ev => {
  const req = ev.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/tests/')) return;
  // pages: network first so you get updates when online, cached copy when offline
  if (req.mode === 'navigate') {
    ev.respondWith(fetch(req).catch(async () => (await caches.match(req)) || caches.match('index.html')));
    return;
  }
  // versioned files never change, so the cache wins; anything new is cached on first use
  ev.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  })());
});
