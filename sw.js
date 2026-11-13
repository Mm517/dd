/* Kitchenly service worker: يخلّي الموقع يتثبّت كتطبيق ويفتح بسرعة وبدون اتصال (للصفحات اللي اتفتحت قبل كده). */
const V = 'kt-v1', STATIC = `${V}-static`, PAGES = `${V}-pages`, IMGS = `${V}-img`;
const SHELL = ['/offline.html', '/css/main.css', '/js/config.js', '/js/app.js', '/js/store.js', '/js/account.js', '/js/extra.js', '/js/admin.js', '/assets/icons/icon-192.png', '/assets/img/logo-mark.jpg'];

self.addEventListener('install', e => { e.waitUntil(caches.open(STATIC).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(V)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const trim = async (name, max) => { const c = await caches.open(name), ks = await c.keys(); if (ks.length > max) { await c.delete(ks[0]); trim(name, max); } };

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin !== location.origin) return;            // Supabase والخطوط والـ CDN: من الشبكة دايمًا
  if (url.pathname === '/sw.js') return;

  /* الصفحات: الشبكة أولًا (عشان الأسعار والمخزون)، ولو مفيش نت نعرض آخر نسخة أو صفحة offline */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { const r = await fetch(req); if (r.ok) { const c = await caches.open(PAGES); c.put(req, r.clone()); trim(PAGES, 40); } return r; }
      catch { return (await caches.match(req)) || (await caches.match('/offline.html')); }
    })());
    return;
  }

  /* الصور: من الكاش أولًا */
  if (req.destination === 'image') {
    e.respondWith((async () => {
      const hit = await caches.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r.ok) { const c = await caches.open(IMGS); c.put(req, r.clone()); trim(IMGS, 120); } return r; } catch { return Response.error(); }
    })());
    return;
  }

  /* CSS/JS/الأيقونات: نعرض من الكاش فورًا ونحدّثه في الخلفية */
  e.respondWith((async () => {
    const hit = await caches.match(req);
    const net = fetch(req).then(async r => { if (r.ok) { (await caches.open(STATIC)).put(req, r.clone()); } return r; }).catch(() => hit);
    return hit || net;
  })());
});
