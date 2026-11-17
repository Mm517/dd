/* =====================================================================
 * js/shared/premium-store.js
 * الوظيفة: رسم صفحة المتجر البريميوم كصفحة عادية جوه موقع Kitchenly (بدون iframe): قوالب فريش/ليلي/ورقي/جريء بألوان البائع،
 *   أو HTML/CSS مكتوب/مرفوع بيتعرض في shadow DOM بعد التنضيف (أي <script> بيتشال). الملف ده بيستخدمه الموقع المنشور (js/pages/premium-site.js)
 *   ومعاينة لوحة البائع (js/seller/premium.js) فالشكل واحد في الاتنين.
 * يعتمد على: css/pages/premium-site.css · DOMPurify (بيتحمّل عند الحاجة لوضع الكود/الرفع فقط)
 * يعرض على window.KTPremium: TPL, tplOf, defaults, mount, mountCustom
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTPremium = window.KTPremium || {});

/* ===================== #premium-templates: القوالب الجاهزة ===================== */
// #premium #templates #defaults
const TPL = [
  { id: 'fresh', name: 'فريش', desc: 'أخضر هادئ وصورة كبيرة بجانب العنوان، مناسب لأدوات المطبخ والتنظيف.', brand: '#2f7d4a', accent: '#f2b705', bg: '#f7f5ee', tagline: 'كل اللي مطبخك محتاجه في مكان واحد' },
  { id: 'night', name: 'ليلي', desc: 'خلفية داكنة وعنوان في المنتصف فوق صورة كاملة، للمتاجر اللي عايزة شكل فخم.', brand: '#4fbf7f', accent: '#ffd166', bg: '#0f1a14', tagline: 'جودة تحسها من أول استخدام' },
  { id: 'paper', name: 'ورقي', desc: 'تصميم بسيط بخطوط وقوائم، المنتجات صفوف نظيفة سهلة القراءة.', brand: '#1d3b5c', accent: '#c8553d', bg: '#fbfaf7', tagline: 'منتجات مختارة بعناية' },
  { id: 'bold', name: 'جريء', desc: 'كتلة لون كاملة وخط عريض ضخم، للمتاجر اللي بتعمل عروض وتخفيضات.', brand: '#e4572e', accent: '#17bebb', bg: '#fff8f0', tagline: 'عروض بتخلص بسرعة' }
];
const tplOf = id => TPL.find(t => t.id === id) || TPL[0];
const defaults = (st, t) => ({ brand: t.brand, accent: t.accent, bg: t.bg, title: st.name || '', tagline: t.tagline, about: st.description || '', cta: 'تسوّق الآن', hero: st.cover || '', logo: st.logo || '', whatsapp: st.whatsapp || st.phone || '', products: true });

/* ===================== #premium-utils: أدوات صغيرة ===================== */
// #premium #utils
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const norm = s => String(s || '').toLowerCase().replace(/[\u064B-\u065F\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();
const col = (v, d) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : d);
const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const onC = h => (lum(h) > 0.62 ? '#14201a' : '#ffffff');
const ORIGIN = () => new URL('/', document.baseURI).origin;   /* بيشتغل جوه معاينة اللوحة كمان (فيها <base>) */
const safeUrl = u => { u = String(u || '').trim(); return /^https:\/\//i.test(u) ? u : u.startsWith('/') ? ORIGIN() + u : ''; };
const waLink = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '20' + d.slice(1); return d.length > 7 ? `https://wa.me/${d}` : ''; };
const disc = p => (p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0);
const stars = r => { const n = Math.round(r || 0); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };
const CROWN = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/><path d="M5 19h14"/></svg>';
const theme = (S, t) => {
  const brand = col(S.brand, t.brand), accent = col(S.accent, t.accent), bg = col(S.bg, t.bg), dark = lum(bg) < 0.45;
  return { dark, css: `--ps-brand:${brand};--ps-onb:${onC(brand)};--ps-accent:${accent};--ps-ona:${onC(accent)};--ps-bg:${bg};--ps-ink:${dark ? '#eaf3ed' : '#17261d'}` };
};

/* ===================== #premium-card: كارت المنتج ===================== */
// #premium #product-card #add-to-cart
const card = p => {
  const d = disc(p), out = p.stock < 1, u = `/product/${encodeURIComponent(p.slug)}`;
  return `<article class="ps-p"><a class="ps-p__i" href="${u}" data-o="${esc(p.slug)}"><img src="${esc(p.image)}" alt="" loading="lazy">${d ? `<span class="ps-p__off">-${d}%</span>` : ''}</a><div class="ps-p__b"><a class="ps-p__n" href="${u}" data-o="${esc(p.slug)}">${esc(p.name)}</a>${p.reviews_count > 0 ? `<div class="ps-p__r">${stars(p.rating)} <span>(${p.reviews_count})</span></div>` : ''}<div class="ps-p__pr"><b>${fmt(p.price)} جنيه</b>${d ? `<s>${fmt(p.old_price)}</s>` : ''}</div><button type="button" class="ps-p__a" data-add="${esc(p.slug)}"${out ? ' disabled' : ''}>${out ? 'غير متوفر' : 'أضف للسلة'}</button></div></article>`;
};

/* ===================== #premium-page: صفحة القالب ===================== */
// #premium #template-page #hero #products
function page(d) {
  const st = d.store || {}, t = tplOf(d.tid), S = { ...defaults(st, t), ...(d.settings || {}) }, th = theme(S, t);
  const title = S.title || st.name || '', logo = safeUrl(S.logo || st.logo), hero = safeUrl(S.hero || st.cover) || `${ORIGIN()}/assets/img/hero-kitchen.jpg`;
  const on = S.products !== false, about = S.about || '', wa = waLink(S.whatsapp);
  return `<div class="ps ps--${t.id}${th.dark ? ' ps--dark' : ''}" id="ps-top" data-tpl="${t.id}" style="${th.css}">
<header class="ps-bar"><a class="ps-logo" href="#ps-top">${logo ? `<img src="${esc(logo)}" alt="">` : ''}<span>${esc(title)}</span></a><nav class="ps-links">${on ? '<a href="#ps-products">المنتجات</a>' : ''}${about ? '<a href="#ps-about">عن المتجر</a>' : ''}${wa ? '<a href="#ps-about">تواصل</a>' : ''}</nav><span class="ps-sp"></span>${on ? '<label class="ps-srch"><input id="ps-q" type="search" placeholder="ابحث في المتجر" aria-label="ابحث في المتجر"></label>' : ''}<a class="ps-cart" href="/cart.html" data-go="/cart.html">السلة <b data-cart-count hidden>0</b></a></header>
<section class="ps-hero"><div class="ps-hero__t"><span class="ps-pill">${CROWN} متجر بريميوم${st.city ? ` · ${esc(st.city)}` : ''}</span><h1>${esc(title)}</h1><p>${esc(S.tagline)}</p>${on ? `<a class="ps-btn" href="#ps-products">${esc(S.cta || 'تسوّق الآن')}</a>` : ''}<div class="ps-stats" id="ps-stats"></div></div><div class="ps-hero__i"><img src="${esc(hero)}" alt="">${logo ? `<span class="ps-hero__lg"><img src="${esc(logo)}" alt=""></span>` : ''}</div></section>
<div class="ps-strip" id="ps-strip"></div>
${on ? '<section class="ps-sec" id="ps-dealsec"><h2>عروض المتجر</h2><div class="ps-grid" id="ps-deals"></div></section>' : ''}
${on ? '<section class="ps-sec" id="ps-products"><h2>منتجاتنا</h2><p class="ps-demo" id="ps-demo" hidden>دي منتجات تجريبية للمعاينة بس. منتجاتك المعتمدة هتظهر هنا بدلها.</p><div class="ps-tools"><div class="ps-chips" id="ps-chips"></div><span class="ps-sp"></span><span class="ps-cnt" id="ps-cnt"></span><select class="ps-sort" id="ps-sort" aria-label="ترتيب"><option value="new">الأحدث</option><option value="price-asc">الأقل سعرًا</option><option value="price-desc">الأعلى سعرًا</option><option value="rating">الأعلى تقييمًا</option></select></div><div class="ps-grid" id="ps-grid"></div></section>' : ''}
${about || wa ? `<section class="ps-sec ps-ab" id="ps-about"><div>${about ? `<h2>عن المتجر</h2><p>${esc(about)}</p>` : ''}</div>${wa ? `<div class="ps-ct"><h3>تواصل معنا</h3><a class="ps-btn" target="_blank" rel="noopener" href="${wa}">راسلنا على واتساب</a></div>` : ''}</section>` : ''}
<footer class="ps-foot"><div>© ${new Date().getFullYear()} ${esc(title)}</div><div><a href="/shop.html" data-go="/shop.html">تسوّق من متاجر أخرى على Kitchenly</a></div></footer>
${wa ? `<a class="ps-wa" target="_blank" rel="noopener" href="${wa}">واتساب</a>` : ''}</div>`;
}

/* بحث وأقسام وترتيب وعروض (الحدث على root نفسه: إعادة الرسم تستبدل المستمعات بدل ما تتراكم) */
function bind(root, d, h) {
  const P = d.products || [], shop = d.shop || {}, st = d.store || {}, $ = s => root.querySelector(s);
  let cat = '', q = '', sort = 'new';
  const list = () => {
    const r = P.filter(p => (!cat || p.category === cat) && (!q || norm(`${p.name} ${p.category || ''} ${p.description || ''}`).includes(q)));
    if (sort === 'price-asc') r.sort((a, b) => a.price - b.price); else if (sort === 'price-desc') r.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') r.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews_count || 0) - (a.reviews_count || 0));
    return r;
  };
  const draw = () => { if (!$('#ps-grid')) return; const r = list(); $('#ps-grid').innerHTML = r.length ? r.map(card).join('') : `<p class="ps-none">${P.length ? 'لا توجد منتجات مطابقة لبحثك.' : 'المنتجات قريبًا.'}</p>`; $('#ps-cnt').textContent = `${r.length} منتج`; };
  const cats = []; P.forEach(p => { if (p.category && !cats.includes(p.category)) cats.push(p.category); });
  if ($('#ps-chips')) $('#ps-chips').innerHTML = cats.length > 1 ? `<button type="button" class="ps-chip" data-c="" aria-pressed="true">الكل</button>${cats.map(c => `<button type="button" class="ps-chip" data-c="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}` : '';
  const deals = P.filter(p => disc(p) > 0).sort((a, b) => disc(b) - disc(a)).slice(0, 4);
  if ($('#ps-dealsec')) { if (deals.length) $('#ps-deals').innerHTML = deals.map(card).join(''); else $('#ps-dealsec').hidden = true; }
  if ($('#ps-demo')) $('#ps-demo').hidden = !d.demo;
  let s = `<div><b>${P.length}</b><span>منتج</span></div>`;
  if (shop.freeShipFrom) s += `<div><b>${fmt(shop.freeShipFrom)}</b><span>شحن مجاني فوق (جنيه)</span></div>`;
  if (st.city) s += `<div><b>${esc(st.city)}</b><span>مقر المتجر</span></div>`;
  if ($('#ps-stats')) $('#ps-stats').innerHTML = s;
  if ($('#ps-strip')) $('#ps-strip').innerHTML = `${shop.freeShipFrom ? `<span>شحن مجاني للطلبات فوق ${fmt(shop.freeShipFrom)} جنيه</span>` : ''}<a href="/track" data-go="/track">تتبّع طلبك</a><a href="/policy" data-go="/policy">سياسة الاسترجاع والشحن</a>`;
  root.onclick = e => {
    const t = e.target.closest ? e.target : e.target.parentElement; if (!t) return;
    const a = t.closest('[data-add]'), o = t.closest('[data-o]'), g = t.closest('[data-go]'), c = t.closest('[data-c]');
    if (a) { if (h.onAdd) h.onAdd(a.getAttribute('data-add')); return; }   /* بدون onAdd: زر السلة العام في الموقع (cart-fx) هو اللي بيشتغل */
    if (o && h.onOpen) { e.preventDefault(); h.onOpen(o.getAttribute('data-o')); return; }
    if (g && h.onGoto) { e.preventDefault(); h.onGoto(g.getAttribute('data-go')); return; }
    if (c) { cat = c.getAttribute('data-c'); root.querySelectorAll('[data-c]').forEach(x => x.setAttribute('aria-pressed', x === c ? 'true' : 'false')); draw(); }
  };
  root.oninput = e => { if (e.target.id !== 'ps-q') return; q = norm(e.target.value); draw(); if (q && $('#ps-products')) $('#ps-products').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  root.onchange = e => { if (e.target.id === 'ps-sort') { sort = e.target.value; draw(); } };
  draw();
}

/* وضع القالب: d = { store, products, shop, demo, tid, settings }، h = { onAdd, onOpen, onGoto } (كلها اختيارية) */
function mount(root, d, h = {}) { root.innerHTML = page(d); bind(root, d, h); }

/* ===================== #premium-custom: HTML/CSS مكتوب أو مرفوع (بدون JavaScript) ===================== */
// #premium #custom #shadow-dom #sanitize #dompurify
/* الـ JavaScript بتاع البائع مش بيتشغّل هنا: تشغيله في نفس صفحة الموقع هيخلّيه يوصل لجلسات العملاء. بنعرض HTML و CSS بس بعد التنضيف. */
const DP_URL = 'https://cdn.jsdelivr.net/npm/dompurify@3.4.17/dist/purify.min.js', DP_SRI = 'sha384-P0JNneQf81HOl9VwNXK76cQ9VMD6Nfsnepxb0cCOg8+UzEdzgPHAPV4wVQrvYQSx';
let dpP = null, hooked = false;
const loadDP = () => (window.DOMPurify ? Promise.resolve(window.DOMPurify) : (dpP ||= new Promise((res, rej) => {
  const s = document.createElement('script'); s.src = DP_URL; s.integrity = DP_SRI; s.crossOrigin = 'anonymous';
  s.onload = () => res(window.DOMPurify); s.onerror = () => { dpP = null; rej(new Error('تعذر تحميل أداة تنضيف الكود')); }; document.head.appendChild(s);
})));
const FORBID = ['script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'option', 'base', 'meta', 'link', 'style', 'noscript', 'template'];
const cssSafe = c => String(c || '').replace(/@import[^;]*;?/gi, '').replace(/expression\s*\(|javascript:|behavior\s*:|-moz-binding/gi, '').replace(/(^|[{}\s,;])(?:html|body|:root)(?=[\s,{.:[>+~#])/gi, '$1.kt-root');
const HOST_CSS = ':host{display:block;contain:layout paint;isolation:isolate}.kt-root{font-family:"Readex Pro",system-ui,Tahoma,sans-serif;line-height:1.7;color:#17261d;min-height:60vh;overflow-wrap:anywhere}.kt-root img{max-width:100%}.kt-root *,.kt-root *::before,.kt-root *::after{box-sizing:border-box}';
const gridOf = (P, demo) => `<div class="ps ps--fresh" style="${theme({}, tplOf('fresh')).css}">${demo ? '<p class="ps-demo">دي منتجات تجريبية للمعاينة بس. منتجاتك المعتمدة هتظهر هنا بدلها.</p>' : ''}<div class="ps-grid">${P.map(card).join('') || '<p class="ps-none">المنتجات قريبًا.</p>'}</div></div>`;

async function mountCustom(host, d, site, h = {}) {
  const DP = await loadDP();
  if (!hooked) { hooked = true; DP.addHook('afterSanitizeAttributes', n => { if (n.tagName === 'A' && n.getAttribute('target')) n.setAttribute('rel', 'noopener noreferrer'); }); }
  const doc = new DOMParser().parseFromString(site.html || '', 'text/html'), sty = [...doc.querySelectorAll('style')].map(s => s.textContent); doc.querySelectorAll('style').forEach(s => s.remove());
  const clean = DP.sanitize(doc.body.innerHTML, { FORBID_TAGS: FORBID, FORBID_ATTR: ['srcdoc', 'formaction', 'action'], USE_PROFILES: { html: true, svg: true } });
  const sr = host.shadowRoot || host.attachShadow({ mode: 'open' }), P = d.products || [];
  sr.innerHTML = `<link rel="stylesheet" href="${ORIGIN()}/css/pages/premium-site.css"><style>${HOST_CSS}\n${cssSafe(`${sty.join('\n')}\n${site.css || ''}`)}</style><div class="kt-root">${clean}</div>`;
  const root = sr.querySelector('.kt-root'), hooks = root.querySelectorAll('[data-kt-products]');
  if (hooks.length) hooks.forEach(el => { el.innerHTML = gridOf(P, d.demo); }); else root.insertAdjacentHTML('beforeend', `<section class="ps-auto" id="ps-products"><h2>منتجاتنا</h2>${gridOf(P, d.demo)}</section>`);
  root.querySelectorAll('[data-kt-store-name]').forEach(el => { el.textContent = (d.store || {}).name || ''; });
  root.querySelectorAll('[data-kt-cart]').forEach(a => { a.setAttribute('href', '/cart.html'); a.setAttribute('data-go', '/cart.html'); });
  if (sr._h) sr.removeEventListener('click', sr._h);
  sr._h = e => {
    const t = e.target.closest ? e.target : e.target.parentElement; if (!t) return;
    const a = t.closest('[data-add]'), o = t.closest('[data-o]'), g = t.closest('[data-go]'), hash = t.closest('a[href^="#"]');
    if (a) { if (h.onAdd) h.onAdd(a.getAttribute('data-add')); return; }
    if (o && h.onOpen) { e.preventDefault(); h.onOpen(o.getAttribute('data-o')); return; }
    if (g && h.onGoto) { e.preventDefault(); h.onGoto(g.getAttribute('data-go')); return; }
    if (hash && hash.getAttribute('href').length > 1) { e.preventDefault(); const el = sr.getElementById(decodeURIComponent(hash.getAttribute('href').slice(1))); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  sr.addEventListener('click', sr._h);
}

Object.assign(NS, { TPL, tplOf, defaults, mount, mountCustom });
})();
