/* Kitchenly service worker: يخلّي الموقع يتثبّت كتطبيق ويفتح بسرعة وبدون اتصال (للصفحات اللي اتفتحت قبل كده). */
const V = 'kt-v5', STATIC = `${V}-static`, PAGES = `${V}-pages`, IMGS = `${V}-img`;
const SHELL = [
  '/offline.html',
  '/css/base.css',
  '/css/components/ui-kit.css',
  '/css/layout/header.css',
  '/css/components/tabbar.css',
  '/css/pages/home.css',
  '/css/components/product-card.css',
  '/css/pages/inner-pages.css',
  '/css/components/tables-dialogs.css',
  '/css/layout/footer.css',
  '/css/components/newsletter.css',
  '/css/components/reviews.css',
  '/css/pages/profile.css',
  '/css/pages/help-legal-join.css',
  '/css/components/media.css',
  '/css/layout/catnav-more.css',
  '/css/components/quick-cards.css',
  '/css/pages/payment-legal-track-auth.css',
  '/css/components/banner-skeleton.css',
  '/css/components/product-card-v2.css',
  '/css/pages/states-about.css',
  '/css/components/media-box-focus.css',
  '/css/components/tabbar-glass.css',
  '/css/components/install-banner.css',
  '/css/pages/partner-store.css',
  '/css/components/product-card-motion.css',
  '/js/core/config.js',
  '/js/core/utils.js',
  '/js/core/supabase.js',
  '/js/ui/icons.js',
  '/js/ui/toast.js',
  '/js/features/cart.js',
  '/js/core/data.js',
  '/js/features/search.js',
  '/js/features/discover.js',
  '/js/ui/cards.js',
  '/js/ui/states.js',
  '/js/ui/search-box.js',
  '/js/ui/header.js',
  '/js/ui/footer.js',
  '/js/ui/card-motion.js',
  '/js/ui/cart-fx.js',
  '/js/features/install.js',
  '/js/core/boot.js',
  '/js/ui/list-parts.js',
  '/js/pages/home.js',
  '/js/pages/catalog.js',
  '/js/pages/product.js',
  '/js/pages/cart.js',
  '/js/pages/checkout.js',
  '/js/pages/track.js',
  '/js/pages/contact-404.js',
  '/js/features/ads.js',
  '/js/pages/partner-store.js',
  '/js/pages/auth.js',
  '/js/features/reviews.js',
  '/js/pages/profile.js',
  '/js/pages/yours.js',
  '/js/pages/help.js',
  '/js/pages/legal.js',
  '/js/pages/join-about.js',
  '/assets/icons/icon-192.png',
  '/assets/img/logo-mark.jpg'
];

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
  if (/^\/(admin|be-seller|stuff)(\/|$)/.test(url.pathname) || url.pathname === '/css/panel.css' || /^\/js\/(panel|admin|seller|stuff)\//.test(url.pathname)) return;   // اللوحات دايمًا من الشبكة

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
