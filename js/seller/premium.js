/* =====================================================================
 * js/seller/premium.js
 * الوظيفة: صفحات البريميوم في لوحة البائع (/be-seller/premuim/...): تفعيل بالكود، بناء متجر خاص بقالب جاهز أو بكتابة كود أو برفع ملفات.
 *   الموقع المنشور بيظهر على domain/<slug> (صفحة premium-site) ومتصل بمنتجات المتجر الحقيقية وسلة Kitchenly عن طريق الكائن window.KITCHENLY.
 * يعتمد على: js/seller/shared.js [BASE, approved, pgh, field, sel, pages] · window.Panel [sb, $, $$, esc, ic, toast, ask, go, imageField, bindImage, date, dt, badge]
 * يعرض على window.Panel.seller: PREM (المسارات) · isPremium · premiumLocked
 * الجداول: kt_stores.premium_until · kt_premium_codes (RPC kt_redeem_premium_code) · kt_store_sites (supabase/seller-premium.sql)
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, $$, esc, ic, toast, ask, imageField, bindImage, date, dt, badge } = window.Panel;
const { BASE, approved, pgh, field, sel, pages } = NS;   // js/seller/shared.js

/* ===================== #premium-routes: المسارات والحالة ===================== */
// #seller #premium #routes
const P = `${BASE}/premuim`;
const PREM = {
  code: `${P}/code-entering`,
  build: `${P}/build-ownstore`,
  tpl: `${P}/build-ownstore/template`,
  codeYo: `${P}/build-ownstore/code-yo`,
  write: `${P}/build-ownstore/code-yo/write-and-create`,
  upload: `${P}/build-ownstore/code-yo/upload`,
  gallery: `${P}/premuim-own-templat/templates`,
  edit: `${P}/template-sdeded/edit`
};
const isPremium = c => !!c.store.premium_until && new Date(c.store.premium_until) > new Date();
const premiumLocked = c => `<div class="card lock">${ic('crown')}<h3 style="font-size:1.2rem">هذه الصفحة للمتاجر البريميوم</h3><p style="color:var(--muted);max-width:440px;margin:6px auto 16px">${c.store.premium_until ? 'انتهت مدة البريميوم في متجرك. أدخل كود جديد لتكمل تعديل موقعك.' : 'فعّل البريميوم بكود التفعيل لتبني موقعك الخاص بقالب جاهز أو بالكود.'}</p><a class="btn btn-p" data-l href="${PREM.code}">إدخال كود التفعيل</a></div>`;

const go = (h, r) => window.Panel.go(h, r);
const deb = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const crumbs = items => `<nav class="pcrumbs" aria-label="مسار الصفحة">${items.map(([t, h], i) => (h ? `<a data-l href="${h}">${t}</a>` : i === items.length - 1 ? `<span aria-current="page">${t}</span>` : `<span>${t}</span>`) + (i < items.length - 1 ? '<i aria-hidden="true">/</i>' : '')).join('')}</nav>`;
const MODE = { template: 'قالب جاهز', code: 'كود مكتوب', upload: 'ملفات مرفوعة' };
const siteUrl = c => `${location.host}/${c.store.slug}`;

/* ===================== #premium-data: قراءة وحفظ موقع المتجر ===================== */
// #seller #premium #site #supabase
const getSite = async c => { const { data, error } = await sb.from('kt_store_sites').select('*').eq('store_id', c.store.id).maybeSingle(); if (error) throw error; return data; };
const putSite = async (c, row) => {
  const { error } = await sb.from('kt_store_sites').upsert({ store_id: c.store.id, updated_at: new Date().toISOString(), ...row }, { onConflict: 'store_id' });
  if (error) throw new Error(/check|violat|too long/i.test(error.message) ? 'حجم الكود أكبر من المسموح' : /row-level|policy/i.test(error.message) ? 'البريميوم غير مفعّل أو انتهت مدته' : 'تعذر الحفظ، حاول مرة أخرى');
};
const patchSite = async (c, row) => { const { error } = await sb.from('kt_store_sites').update({ ...row, updated_at: new Date().toISOString() }).eq('store_id', c.store.id); if (error) throw new Error('تعذر الحفظ'); };
const LIM = { html: 400000, css: 200000, js: 200000 };
/* لو عنده موقع بنوع مختلف، لازم يوافق قبل ما نستبدله */
const confirmReplace = async (site, mode) => !site || site.mode === mode || !site.html || (await ask(`عندك موقع حالي (${MODE[site.mode]}). حفظ الجديد هيستبدله. تكمل؟`, 'استبدال', true));

/* ===================== #premium-bridge: ربط الموقع بمنتجات المتجر والسلة ===================== */
// #seller #premium #bridge #kitchenly-api #postmessage
/* بيانات المعاينة: نفس شكل البيانات اللي بتتحقن في الموقع المنشور (window.KITCHENLY) */
const abs = u => { u = String(u || ''); return /^https?:/i.test(u) ? u : u ? location.origin + '/' + u.replace(/^\//, '') : ''; };
const DEMO = [['منظم أدوات المائدة', 189, 240, 'cutlery-holder.jpg', 'منظمات'], ['مناشف ميكروفايبر', 95, 120, 'microfiber-towels.jpg', 'تنظيف'], ['حامل إسفنج للمجلى', 79, 0, 'sponge-holders.jpg', 'منظمات'], ['فرشاة تنظيف ملوّنة', 55, 70, 'brush-colors.jpg', 'تنظيف']];
async function loadBridge(c) {
  const { data } = await sb.from('kt_products').select('slug,name,price,old_price,image,images,stock,rating,reviews_count,short_desc,category:kt_categories(name)').eq('store_id', c.store.id).eq('approval_status', 'approved').eq('active', true).order('created_at', { ascending: false }).limit(60);
  let products = (data || []).map(p => ({ slug: p.slug, name: p.name, price: +p.price, old_price: +p.old_price || 0, image: abs(p.image), images: (p.images || []).map(abs), stock: p.stock, rating: +p.rating || 0, reviews_count: p.reviews_count || 0, description: p.short_desc || '', category: p.category?.name || '' })), demo = false;
  if (!products.length) { demo = true; products = DEMO.map(([name, price, old, img, category], i) => ({ slug: `demo-${i}`, name, price, old_price: old, image: abs(`assets/img/${img}`), images: [], stock: 20, rating: 4.5, reviews_count: 12, description: '', category })); }
  const s = c.store;
  return { store: { name: s.name, slug: s.slug, logo: abs(s.logo), cover: abs(s.cover), description: s.description || '', city: s.city || '' }, products, demo, shop: { freeShipFrom: window.KT.freeShipFrom, shippingFee: window.KT.shippingFee }, cartCount: 0 };
}
/* السكريبت اللي بيتحقن في بداية الصفحة (المعاينة هنا، والموقع المنشور في js/pages/premium-site.js) */
const bridgeScript = d => `<script>(function(){var d=${JSON.stringify(d).replace(/</g, '\\u003c')};var P=function(m){parent.postMessage(m,'*')};var K=window.KITCHENLY={store:d.store,products:d.products,shop:d.shop,demo:!!d.demo,cartCount:d.cartCount||0,addToCart:function(s,q){P({kt:'add',slug:s,qty:q||1})},openProduct:function(s){P({kt:'open',slug:s})},cart:function(){P({kt:'cart'})},goto:function(u){P({kt:'goto',url:u})}};addEventListener('message',function(e){var m=e.data;if(m&&m.kt==='count'){K.cartCount=m.n;dispatchEvent(new CustomEvent('kitchenly:cart',{detail:m.n}))}});P({kt:'ready'})})();<\/script>`;
const withBridge = (html, d) => { const b = bridgeScript(d); return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + b) : /<html[^>]*>/i.test(html) ? html.replace(/<html[^>]*>/i, m => `${m}<head>${b}</head>`) : b + html; };

/* ===================== #premium-doc: بناء صفحة الموقع للمعاينة والنشر ===================== */
// #seller #premium #preview #sandbox #compose
const origin = () => location.origin;
const safeUrl = u => { u = String(u || '').trim(); return /^https:\/\//i.test(u) ? u : u.startsWith('/') ? origin() + u : ''; };
const col = (v, d) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : d);
const onC = h => { const n = parseInt(h.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62 ? '#14201a' : '#ffffff'; };
const waLink = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '20' + d.slice(1); return d.length > 7 ? `https://wa.me/${d}` : ''; };

/* دمج html/css/js في صفحة واحدة (للكود المكتوب والمرفوع) */
function compose({ html = '', css = '', js = '' }) {
  const style = css.trim() ? `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>` : '', script = js.trim() ? `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n<\/script>` : '';
  if (/<html[\s>]/i.test(html)) {
    const d = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, () => `${style}</head>`) : style + html;
    return /<\/body>/i.test(d) ? d.replace(/<\/body>/i, () => `${script}</body>`) : d + script;
  }
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${style}</head><body>${html}${script}</body></html>`;
}

/* القوالب الجاهزة: نفس الهيكل بأربع شخصيات مختلفة. المنتجات بتتحمّل لحظيًا من window.KITCHENLY (مش نسخة ثابتة) */
const TPL = [
  { id: 'fresh', name: 'فريش', desc: 'أخضر هادئ وصورة كبيرة بجانب العنوان، مناسب لأدوات المطبخ والتنظيف.', brand: '#2f7d4a', accent: '#f2b705', bg: '#f7f5ee', ink: '#17261d', tagline: 'كل اللي مطبخك محتاجه في مكان واحد' },
  { id: 'night', name: 'ليلي', desc: 'خلفية داكنة وعنوان في المنتصف فوق صورة كاملة، للمتاجر اللي عايزة شكل فخم.', brand: '#4fbf7f', accent: '#ffd166', bg: '#0f1a14', ink: '#eaf3ed', tagline: 'جودة تحسها من أول استخدام' },
  { id: 'paper', name: 'ورقي', desc: 'تصميم بسيط بخطوط وقوائم، المنتجات صفوف نظيفة سهلة القراءة.', brand: '#1d3b5c', accent: '#c8553d', bg: '#fbfaf7', ink: '#1b1b1b', tagline: 'منتجات مختارة بعناية' },
  { id: 'bold', name: 'جريء', desc: 'كتلة لون كاملة وخط عريض ضخم، للمتاجر اللي بتعمل عروض وتخفيضات.', brand: '#e4572e', accent: '#17bebb', bg: '#fff8f0', ink: '#2a1a12', tagline: 'عروض بتخلص بسرعة' }
];
const tplOf = id => TPL.find(t => t.id === id) || TPL[0];
const defaults = (st, t) => ({ brand: t.brand, accent: t.accent, bg: t.bg, title: st.name || '', tagline: t.tagline, about: st.description || '', cta: 'تسوّق الآن', hero: st.cover || '', logo: st.logo || '', whatsapp: st.whatsapp || st.phone || '', products: true });

const BASE_CSS = `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:"Readex Pro",system-ui,Tahoma,sans-serif;line-height:1.7;background:var(--bg);color:var(--ink)}img{max-width:100%;display:block}a{color:inherit;text-decoration:none}h1,h2,p{margin:0}[hidden]{display:none!important}
.nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;padding:12px 6vw;background:var(--bg);border-bottom:1px solid var(--line)}.logo{display:flex;align-items:center;gap:10px;font-weight:600;white-space:nowrap}.logo img{width:38px;height:38px;border-radius:11px;object-fit:cover}.nav__links{display:flex;gap:18px;font-size:.92rem;margin-inline-start:10px}.nav__links a{opacity:.72}.nav__links a:hover{opacity:1}.sp{flex:1}
.srch{display:flex;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:99px;padding:0 14px;min-width:190px}.srch input{border:0;background:transparent;font:inherit;color:inherit;padding:8px 4px;width:100%;outline:0}
.cartb{display:inline-flex;align-items:center;gap:8px;background:var(--brand);color:var(--onb);border:0;border-radius:99px;padding:9px 18px;font:inherit;cursor:pointer;white-space:nowrap}.cartb b{background:var(--accent);color:#14201a;border-radius:99px;min-width:20px;height:20px;font-size:.75rem;display:grid;place-items:center;padding:0 5px}
.btn{display:inline-block;background:var(--brand);color:var(--onb);padding:12px 26px;border-radius:99px;font-weight:500;border:0;font:inherit;cursor:pointer}
.hero{display:grid;gap:5vw;align-items:center;padding:4vw 6vw 3vw}.hero h1{font-size:clamp(2rem,5.4vw,3.8rem);line-height:1.2;margin-bottom:14px}.hero p{max-width:46ch;opacity:.82;margin-bottom:24px}.hero__i img{width:100%;aspect-ratio:4/3;object-fit:cover}
.stats{display:flex;flex-wrap:wrap;gap:12px 30px;margin-top:26px}.stats b{display:block;font-size:1.35rem;line-height:1.2}.stats span{font-size:.8rem;opacity:.7}
.strip{display:flex;flex-wrap:wrap;gap:8px 30px;justify-content:center;padding:14px 6vw;border-block:1px solid var(--line);font-size:.88rem}.strip a{text-decoration:underline;text-underline-offset:3px}
.sec{padding:4vw 6vw}.sec h2{font-size:clamp(1.4rem,3vw,2rem);margin-bottom:18px}
.tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:18px}.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{border:1px solid var(--line);background:var(--card);color:inherit;border-radius:99px;padding:6px 16px;font:inherit;font-size:.88rem;cursor:pointer}.chip[aria-pressed=true]{background:var(--brand);color:var(--onb);border-color:var(--brand)}.cnt{font-size:.85rem;opacity:.65}.sort{border:1px solid var(--line);background:var(--card);color:inherit;border-radius:10px;padding:7px 10px;font:inherit;font-size:.88rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}.none{grid-column:1/-1;opacity:.65;text-align:center;padding:30px 0}.demo{background:var(--card);border:1px dashed var(--line);border-radius:12px;padding:10px 14px;font-size:.85rem;margin-bottom:16px}
.p{position:relative;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column}.p__i{display:block;aspect-ratio:1;overflow:hidden;cursor:pointer;background:rgba(127,127,127,.12)}.p__i img{width:100%;height:100%;object-fit:cover}
.p__off{position:absolute;top:10px;inset-inline-start:10px;background:var(--accent);color:#14201a;font-size:.75rem;font-weight:600;border-radius:99px;padding:2px 10px}.p__b{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;flex:1}.p__n{font-weight:500;line-height:1.45;cursor:pointer}.p__r{font-size:.78rem;opacity:.8;color:var(--accent)}.p__r span{color:inherit;opacity:.7}
.p__pr{display:flex;align-items:baseline;gap:8px;margin-top:auto}.p__pr b{font-size:1.1rem;color:var(--brand)}.p__pr s{opacity:.5;font-size:.85rem}.p__a{border:0;border-radius:12px;background:var(--brand);color:var(--onb);padding:10px;font:inherit;cursor:pointer}.p__a:disabled{opacity:.5;cursor:not-allowed}
.ab{display:grid;grid-template-columns:1.4fr 1fr;gap:4vw;align-items:start}.ab p{max-width:62ch;opacity:.85}.ct{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;display:grid;gap:10px}.ct h3{margin:0;font-size:1.05rem}.ct .btn{text-align:center}
.wa{position:fixed;bottom:18px;inset-inline-end:18px;z-index:30;background:#25d366;color:#fff;border-radius:99px;padding:11px 20px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.foot{padding:28px 6vw 36px;text-align:center;font-size:.85rem;opacity:.7;display:grid;gap:6px;border-top:1px solid var(--line)}.foot a{text-decoration:underline;text-underline-offset:3px}
@media(max-width:860px){.hero,.ab{grid-template-columns:1fr!important}.nav__links{display:none}.srch{min-width:0;flex:1}.nav{flex-wrap:wrap}.logo span{max-width:34vw;overflow:hidden;text-overflow:ellipsis}}`;
const TPL_CSS = {
  fresh: `:root{--card:#fff;--line:rgba(0,0,0,.09)}.hero{grid-template-columns:1.1fr 1fr}.hero__i img{border-radius:30px}.ab{background:rgba(0,0,0,.03)}.p{box-shadow:0 1px 2px rgba(0,0,0,.04)}`,
  night: `:root{--card:rgba(255,255,255,.06);--line:rgba(255,255,255,.13)}.hero{position:relative;min-height:70vh;grid-template-columns:1fr;text-align:center;justify-items:center;align-content:center;isolation:isolate;margin:0}.hero__i{position:absolute;inset:0;z-index:-1}.hero__i img{height:100%;aspect-ratio:auto;filter:brightness(.38)}.hero p{margin-inline:auto}.stats{justify-content:center}.nav{background:rgba(15,26,20,.92)}.p{backdrop-filter:blur(6px)}`,
  paper: `:root{--card:transparent;--line:rgba(0,0,0,.16)}body{font-family:Georgia,"Readex Pro",serif}.hero{grid-template-columns:1fr}.hero__i{display:none}.hero h1{font-size:clamp(2.4rem,7vw,5.2rem);letter-spacing:-.01em}.btn,.cartb,.p__a,.chip,.srch{border-radius:2px}.grid{grid-template-columns:1fr;gap:0}.p{display:grid;grid-template-columns:96px 1fr;border-radius:0;border-width:1px 0 0}.p:last-child{border-bottom-width:1px}.p__i{aspect-ratio:auto;height:96px;margin:10px}.p__b{padding:10px 14px}.p__off{display:none}.p__a{align-self:start;padding:6px 16px}.ct{border-radius:0}`,
  bold: `:root{--card:#fff;--line:var(--ink)}.nav{background:var(--brand);color:var(--onb);border-color:var(--ink)}.nav .srch{color:var(--ink)}.nav .cartb{background:var(--ink);color:#fff}.hero{grid-template-columns:1.2fr 1fr;background:var(--brand);color:var(--onb);padding-block:6vw;border-bottom:10px solid var(--accent)}.hero h1{font-size:clamp(2.6rem,8vw,6rem);line-height:1.05;font-weight:700}.hero .btn{background:var(--accent);color:#14201a}.hero__i img{border:6px solid var(--onb);border-radius:0 40px 0 40px}.p{border:3px solid var(--ink);border-radius:6px;box-shadow:6px 6px 0 var(--accent)}.chip{border:2px solid var(--ink)}.ct{border:3px solid var(--ink);border-radius:6px}`
};
/* منطق القالب (بيتشغّل جوه الصفحة): بيقرأ window.KITCHENLY ويعرض المنتجات والبحث والأقسام والعروض */
function tplRuntime() {
  var K = window.KITCHENLY || { store: {}, products: [], shop: {}, cartCount: 0, addToCart: function () {}, openProduct: function () {}, cart: function () {}, goto: function () {} };
  var $ = function (s) { return document.querySelector(s); };
  var fmt = function (n) { return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (s) { return String(s || '').toLowerCase().replace(/[\u064B-\u065F\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim(); };
  var P = K.products || [], cat = '', q = '', sort = 'new';
  var disc = function (p) { return p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0; };
  var stars = function (r) { var n = Math.round(r); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };
  function card(p) {
    var d = disc(p), out = p.stock < 1;
    return '<article class="p"><a class="p__i" data-o="' + esc(p.slug) + '"><img src="' + esc(p.image) + '" alt="" loading="lazy">' + (d ? '<span class="p__off">-' + d + '%</span>' : '') + '</a><div class="p__b"><a class="p__n" data-o="' + esc(p.slug) + '">' + esc(p.name) + '</a>' + (p.reviews_count > 0 ? '<div class="p__r">' + stars(p.rating) + ' <span>(' + p.reviews_count + ')</span></div>' : '') + '<div class="p__pr"><b>' + fmt(p.price) + ' جنيه</b>' + (d ? '<s>' + fmt(p.old_price) + '</s>' : '') + '</div><button class="p__a" data-a="' + esc(p.slug) + '"' + (out ? ' disabled' : '') + '>' + (out ? 'غير متوفر' : 'أضف للسلة') + '</button></div></article>';
  }
  function list() {
    var r = P.filter(function (p) { return (!cat || p.category === cat) && (!q || norm(p.name + ' ' + (p.category || '') + ' ' + (p.description || '')).indexOf(q) > -1); });
    if (sort === 'price-asc') r.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-desc') r.sort(function (a, b) { return b.price - a.price; });
    else if (sort === 'rating') r.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0) || (b.reviews_count || 0) - (a.reviews_count || 0); });
    return r;
  }
  function draw() {
    if (!$('#grid')) return;
    var r = list();
    $('#grid').innerHTML = r.length ? r.map(card).join('') : '<p class="none">' + (P.length ? 'لا توجد منتجات مطابقة لبحثك.' : 'المنتجات قريبًا.') + '</p>';
    $('#cnt').textContent = r.length + ' منتج';
  }
  var cats = []; P.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
  if ($('#chips')) {
    $('#chips').innerHTML = cats.length > 1 ? '<button class="chip" data-c="" aria-pressed="true">الكل</button>' + cats.map(function (c) { return '<button class="chip" data-c="' + esc(c) + '" aria-pressed="false">' + esc(c) + '</button>'; }).join('') : '';
  }
  var deals = P.filter(function (p) { return disc(p) > 0; }).sort(function (a, b) { return disc(b) - disc(a); }).slice(0, 4);
  if ($('#dealsec')) { if (deals.length) $('#deals').innerHTML = deals.map(card).join(''); else $('#dealsec').hidden = true; }
  if ($('#demo')) $('#demo').hidden = !K.demo;
  var st = '<div><b>' + P.length + '</b><span>منتج</span></div>';
  if (K.shop && K.shop.freeShipFrom) st += '<div><b>' + fmt(K.shop.freeShipFrom) + '</b><span>شحن مجاني فوق (جنيه)</span></div>';
  if (K.store && K.store.city) st += '<div><b>' + esc(K.store.city) + '</b><span>مقر المتجر</span></div>';
  if ($('#stats')) $('#stats').innerHTML = st;
  if ($('#strip')) $('#strip').innerHTML = (K.shop && K.shop.freeShipFrom ? '<span>شحن مجاني للطلبات فوق ' + fmt(K.shop.freeShipFrom) + ' جنيه</span>' : '') + '<a href="#" data-go="/track">تتبّع طلبك</a><a href="#" data-go="/policy">سياسة الاسترجاع والشحن</a>';
  var cc = function (n) { document.querySelectorAll('[data-cc]').forEach(function (el) { el.textContent = n; el.hidden = !n; }); };
  cc(K.cartCount || 0); addEventListener('kitchenly:cart', function (e) { cc(e.detail); });
  document.querySelectorAll('[data-yr]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement, a = t.closest('[data-a]'), o = t.closest('[data-o]'), c = t.closest('[data-c]'), g = t.closest('[data-go]');
    if (a) { K.addToCart(a.getAttribute('data-a')); return; }
    if (o) { e.preventDefault(); K.openProduct(o.getAttribute('data-o')); return; }
    if (g) { e.preventDefault(); K.goto(g.getAttribute('data-go')); return; }
    if (t.closest('#cartb')) { K.cart(); return; }
    if (c) { cat = c.getAttribute('data-c'); document.querySelectorAll('[data-c]').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); }); draw(); }
  });
  if ($('#q')) $('#q').addEventListener('input', function (e) { q = norm(e.target.value); draw(); if (q && $('#products')) $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  if ($('#sort')) $('#sort').addEventListener('change', function (e) { sort = e.target.value; draw(); });
  draw();
}
function siteDoc(tid, s, st) {
  const t = tplOf(tid), brand = col(s.brand, t.brand), accent = col(s.accent, t.accent), bg = col(s.bg, t.bg), wa = waLink(s.whatsapp);
  const logo = safeUrl(s.logo || st.logo), hero = safeUrl(s.hero || st.cover) || `${origin()}/assets/img/hero-kitchen.jpg`, title = s.title || st.name || '';
  const on = s.products !== false, about = s.about || '';
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(s.tagline || about.slice(0, 150))}"><link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>:root{--brand:${brand};--onb:${onC(brand)};--accent:${accent};--bg:${bg};--ink:${col(t.ink, '#17261d')}}${TPL_CSS[t.id]}${BASE_CSS}</style></head><body id="top">
<header class="nav"><a class="logo" href="#top">${logo ? `<img src="${esc(logo)}" alt="">` : ''}<span>${esc(title)}</span></a><nav class="nav__links">${on ? '<a href="#products">المنتجات</a>' : ''}${about ? '<a href="#about">عن المتجر</a>' : ''}${wa ? '<a href="#about">تواصل</a>' : ''}</nav><span class="sp"></span>${on ? '<label class="srch"><input id="q" type="search" placeholder="ابحث في المتجر" aria-label="ابحث في المتجر"></label>' : ''}<button class="cartb" id="cartb" type="button">السلة <b data-cc hidden>0</b></button></header>
<section class="hero"><div class="hero__t"><h1>${esc(title)}</h1><p>${esc(s.tagline)}</p>${on ? `<a class="btn" href="#products">${esc(s.cta || 'تسوّق الآن')}</a>` : ''}<div class="stats" id="stats"></div></div><div class="hero__i"><img src="${esc(hero)}" alt=""></div></section>
<div class="strip" id="strip"></div>
${on ? '<section class="sec" id="dealsec"><h2>عروض المتجر</h2><div class="grid" id="deals"></div></section>' : ''}
${on ? '<section class="sec" id="products"><h2>منتجاتنا</h2><p class="demo" id="demo" hidden>دي منتجات تجريبية للمعاينة بس. منتجاتك المعتمدة هتظهر هنا بدلها.</p><div class="tools"><div class="chips" id="chips"></div><span class="sp"></span><span class="cnt" id="cnt"></span><select class="sort" id="sort" aria-label="ترتيب"><option value="new">الأحدث</option><option value="price-asc">الأقل سعرًا</option><option value="price-desc">الأعلى سعرًا</option><option value="rating">الأعلى تقييمًا</option></select></div><div class="grid" id="grid"></div></section>' : ''}
${about || wa ? `<section class="sec ab" id="about"><div>${about ? `<h2>عن المتجر</h2><p>${esc(about)}</p>` : ''}</div>${wa ? `<div class="ct"><h3>تواصل معنا</h3><a class="btn" target="_blank" rel="noopener" href="${wa}">راسلنا على واتساب</a></div>` : ''}</section>` : ''}
<footer class="foot"><div>© <span data-yr></span> ${esc(title)}</div><div><a href="#" data-go="/shop.html">تسوّق من متاجر أخرى على Kitchenly</a></div></footer>
${wa ? `<a class="wa" target="_blank" rel="noopener" href="${wa}">واتساب</a>` : ''}
<script>(${tplRuntime.toString()})();<\/script></body></html>`;
}

/* صندوق المعاينة (iframe معزول: مفيش وصول لجلسة اللوحة) */
const SANDBOX = 'allow-scripts allow-popups allow-forms allow-modals';
const previewBox = id => `<div class="pv"><div class="pv__bar"><span>معاينة مباشرة</span><div class="chips"><button type="button" class="chip" data-dev="d" aria-pressed="true">كمبيوتر</button><button type="button" class="chip" data-dev="m" aria-pressed="false">موبايل</button></div></div><div class="pv__stage" id="${id}-st"><iframe id="${id}" class="pv__f" title="معاينة الموقع" sandbox="${SANDBOX}"></iframe></div></div>`;
let pvListener = null;
function bindPreview(root, id, data) {
  const frame = $(`#${id}`, root);
  $$('[data-dev]', root).forEach(b => b.onclick = () => { const m = b.dataset.dev === 'm'; $(`#${id}-st`, root).classList.toggle('pv--m', m); $$('[data-dev]', root).forEach(x => x.setAttribute('aria-pressed', x === b)); });
  if (pvListener) window.removeEventListener('message', pvListener);
  pvListener = e => {
    if (e.source !== frame.contentWindow) return; const m = e.data || {};
    if (m.kt === 'ready') frame.contentWindow.postMessage({ kt: 'count', n: 0 }, '*');
    else if (m.kt === 'add') toast('في الموقع المنشور المنتج هيتضاف لسلة العميل');
    else if (m.kt === 'open') toast('في الموقع المنشور هتفتح صفحة المنتج');
    else if (m.kt === 'cart' || m.kt === 'goto') toast('في الموقع المنشور هتفتح الصفحة دي');
  };
  window.addEventListener('message', pvListener);
  return html => { frame.srcdoc = withBridge(html, data); };
}
const saveBar = site => `<div class="savebar"><span class="sub" id="sv-st">${site ? `آخر حفظ ${esc(dt(site.updated_at))}${site.published ? ' · منشور' : ' · مسودة'}` : 'لم يتم الحفظ بعد'}</span><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g" id="sv-d">حفظ كمسودة</button><button class="btn btn-p" id="sv-p">${ic('up', 'sm')} حفظ ونشر</button></div></div>`;

/* ===================== #page-premium-code: تفعيل البريميوم بالكود ===================== */
// #page-premium-code #route #seller #premium #code-entering
pages.premCode = async (el, c) => {
  const on = isPremium(c);
  el.innerHTML = crumbs([['البريميوم'], ['تفعيل بالكود']]) + pgh('تفعيل البريميوم', 'أدخل الكود اللي وصلك من فريق Kitchenly لتفتح بناء متجرك الخاص.') +
    (on ? `<div class="banner" style="background:var(--ok-soft);color:var(--ok)">${ic('check', 'lg')}<div><b>البريميوم شغّال على متجرك</b><p>ينتهي في ${esc(date(c.store.premium_until))}. لو أدخلت كود جديد المدة هتتضاف على الباقي.</p></div></div>` : '') +
    `<div class="g2 grid" style="max-width:920px"><form class="card" id="f" novalidate style="display:grid;gap:14px;align-content:start"><div><label class="lbl" for="cd">كود التفعيل</label><input class="field code-in" id="cd" dir="ltr" autocomplete="off" spellcheck="false" maxlength="32" placeholder="KT-XXXX-XXXX"></div><p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="go">تفعيل الكود</button>${on ? `<a class="btn btn-g btn-block" data-l href="${PREM.build}">كمّل لبناء المتجر</a>` : ''}</form>
    <div class="card"><h3 style="margin-bottom:10px">اللي هتفتحه بالبريميوم</h3><ul class="rows"><li><span>رابط خاص باسم متجرك: <b dir="ltr">${esc(siteUrl(c))}</b></span></li><li><span>قوالب جاهزة بتعرض منتجاتك لحظيًا مع السلة والبحث</span></li><li><span>كتابة HTML و CSS و JavaScript مع الوصول لمنتجاتك</span></li><li><span>رفع ملفات موقعك أو ملف zip</span></li></ul></div></div>`;
  const err = $('#err'), msg = e => { const m = String(e?.message || ''); return /invalid_code/.test(m) ? 'الكود غير صحيح، راجعه وحاول تاني' : /code_used/.test(m) ? 'الكود ده اتستخدم قبل كده' : /store_not_approved/.test(m) ? 'متجرك لازم يتوافق عليه الأول' : 'تعذر التفعيل، حاول مرة أخرى'; };
  $('#cd').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); };
  $('#f').onsubmit = async e => {
    e.preventDefault(); err.hidden = true; const code = $('#cd').value.trim();
    if (code.length < 6) { err.textContent = 'اكتب الكود كامل'; err.hidden = false; return; }
    const b = $('#go'); b.disabled = true; const { error } = await sb.rpc('kt_redeem_premium_code', { p_code: code }); b.disabled = false;
    if (error) { err.textContent = msg(error); err.hidden = false; return; }
    toast('تم تفعيل البريميوم'); go(PREM.build);
  };
};

/* ===================== #page-premium-build: اختيار طريقة بناء المتجر ===================== */
// #page-premium-build #route #seller #premium #build-ownstore
pages.premBuild = async (el, c) => {
  const site = await getSite(c), url = `${location.origin}/${c.store.slug}`;
  const cur = site ? `<div class="card" style="margin-bottom:18px;display:grid;gap:12px"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;justify-content:space-between"><div><h3>موقعك الحالي</h3><p class="sub">${esc(MODE[site.mode])}${site.template_id ? ` · ${esc(tplOf(site.template_id).name)}` : ''} · آخر تعديل ${esc(dt(site.updated_at))}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${badge(site.published ? 'b-ok' : 'b-warn', site.published ? 'منشور' : 'مسودة')}<a class="btn btn-g btn-sm" data-l href="${site.mode === 'template' ? PREM.edit : site.mode === 'upload' ? PREM.upload : PREM.write}">تعديل</a>${site.published ? `<a class="btn btn-g btn-sm" target="_blank" rel="noopener" href="/${esc(c.store.slug)}">${ic('ext', 'sm')} فتح الموقع</a><button class="btn btn-d btn-sm" id="unp">إلغاء النشر</button>` : ''}<button class="btn btn-d btn-sm" id="del">حذف الموقع</button></div></div>${site.published ? `<div class="linkrow"><span dir="ltr">${esc(siteUrl(c))}</span><button class="btn btn-g btn-sm" id="cp">نسخ الرابط</button></div>` : '<p class="hint">الموقع مسودة. اضغط «حفظ ونشر» من صفحة التعديل ليظهر على رابطك الخاص.</p>'}</div>` : '';
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك']]) + pgh('ابنِ متجرك الخاص', `موقعك هيكون على <b dir="ltr">${esc(siteUrl(c))}</b> ومتصل بمنتجاتك وسلة Kitchenly. غير البريميوم بيفضلوا على /store.`) + cur +
    `<div class="choose"><a class="choice" data-l href="${PREM.tpl}"><span class="choice__i">${ic('layers', 'lg')}</span><h3>قالب جاهز</h3><p>اختار تصميم، غيّر الألوان والنصوص والصور، وانشر. منتجاتك والبحث والسلة شغالين تلقائيًا.</p><b class="btn btn-p">ابدأ بقالب</b></a><a class="choice" data-l href="${PREM.codeYo}"><span class="choice__i">${ic('code', 'lg')}</span><h3>بالكود</h3><p>اكتب HTML و CSS و JavaScript بنفسك أو ارفع ملفات موقعك الجاهز، مع وصول لمنتجاتك والسلة.</p><b class="btn btn-g">ابدأ بالكود</b></a></div>`;
  $('#cp')?.addEventListener('click', () => { navigator.clipboard?.writeText(url).then(() => toast('تم نسخ الرابط'), () => toast('تعذر النسخ', 'err')); });
  $('#unp')?.addEventListener('click', async () => { try { await patchSite(c, { published: false }); toast('تم إلغاء النشر'); pages.premBuild(el, c); } catch (e) { toast(e.message, 'err'); } });
  $('#del')?.addEventListener('click', async () => { if (!(await ask('حذف الموقع نهائيًا؟', 'حذف', true))) return; const { error } = await sb.from('kt_store_sites').delete().eq('store_id', c.store.id); toast(error ? 'تعذر الحذف' : 'تم حذف الموقع', error ? 'err' : ''); if (!error) pages.premBuild(el, c); });
};

/* ===================== #page-premium-template: مدخل طريق القالب ===================== */
// #page-premium-template #route #seller #premium #template
pages.premTemplate = async (el, c) => {
  const site = await getSite(c), has = site?.mode === 'template';
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['قالب جاهز']]) + pgh('ابنِ متجرك بقالب جاهز', 'ثلاث خطوات وموقعك يبقى جاهز.') +
    `<ol class="stepsl"><li><b>اختار القالب</b><span>أربعة تصاميم، كلها بتعرض منتجاتك المعتمدة لحظيًا مع بحث وأقسام وعروض وسلة.</span></li><li><b>عدّل عليه</b><span>الألوان والعنوان والنبذة والصور ورقم واتساب، مع معاينة قدامك على طول.</span></li><li><b>انشر</b><span>الموقع بيظهر على ${esc(siteUrl(c))}.</span></li></ol>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><a class="btn btn-p" data-l href="${PREM.gallery}">${has ? 'تغيير القالب' : 'تصفح القوالب'}</a>${has ? `<a class="btn btn-g" data-l href="${PREM.edit}">كمّل التعديل على قالبك</a>` : ''}</div>`;
};

/* ===================== #page-premium-templates: معرض القوالب ===================== */
// #page-premium-templates #route #seller #premium #templates
pages.premTemplates = async (el, c) => {
  const site = await getSite(c), data = await loadBridge(c);
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['قالب جاهز', PREM.tpl], ['القوالب']]) + pgh('اختار قالبك', 'المعاينة بتاعتك فعلًا: باسم متجرك وبمنتجاتك.') +
    `<div class="tgrid">${TPL.map(t => `<article class="card tcard"><div class="tcard__pv" data-pv="${t.id}"><iframe tabindex="-1" title="${esc(t.name)}" sandbox="allow-scripts"></iframe></div><div class="tcard__b"><h3>${esc(t.name)}${site?.template_id === t.id ? ` ${badge('b-ok', 'قالبك الحالي')}` : ''}</h3><p>${esc(t.desc)}</p><button class="btn btn-p btn-block" data-use="${t.id}">${site?.template_id === t.id ? 'كمّل التعديل' : 'استخدم هذا القالب'}</button></div></article>`).join('')}</div>`;
  $$('[data-pv]').forEach(b => { const t = tplOf(b.dataset.pv); $('iframe', b).srcdoc = withBridge(siteDoc(t.id, defaults(c.store, t), c.store), data); });
  const fit = () => $$('[data-pv]').forEach(b => { const k = b.clientWidth / 1200, f = $('iframe', b); f.style.transform = `scale(${k})`; b.style.height = `${Math.round(820 * k)}px`; });
  fit(); window.addEventListener('resize', fit, { once: true }); requestAnimationFrame(fit);
  $$('[data-use]').forEach(b => b.onclick = async () => {
    const t = tplOf(b.dataset.use);
    if (site?.mode === 'template') { if (site.template_id !== t.id) await patchSite(c, { template_id: t.id }).catch(() => {}); return go(PREM.edit); }
    if (!(await confirmReplace(site, 'template'))) return;
    b.disabled = true; const s = defaults(c.store, t);
    try { await putSite(c, { mode: 'template', template_id: t.id, settings: s, html: siteDoc(t.id, s, c.store), css: '', js: '', published: false }); go(PREM.edit); } catch (e) { toast(e.message, 'err'); b.disabled = false; }
  });
};

/* ===================== #page-premium-edit: تعديل القالب ===================== */
// #page-premium-edit #route #seller #premium #template-edit
pages.premEdit = async (el, c) => {
  const site = await getSite(c);
  if (!site || site.mode !== 'template') return go(PREM.gallery, true);
  const data = await loadBridge(c); let tid = site.template_id, published = site.published;
  const S = { ...defaults(c.store, tplOf(tid)), ...(site.settings || {}) };
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['قالب جاهز', PREM.tpl], ['تعديل القالب']]) + pgh('تعديل القالب', 'أي تغيير بيظهر في المعاينة على طول، ولازم تحفظ عشان يتثبّت. المنتجات بتتحدّث لوحدها من متجرك.', `<a class="btn btn-g" data-l href="${PREM.gallery}">تغيير القالب</a>`) +
    `<div class="pe"><form class="card pe__f" id="f" novalidate>${sel('e-tpl', 'القالب', TPL.map(t => [t.id, t.name]), tid)}
    <div class="fgrid two">${field('e-title', 'اسم المتجر في الموقع', `maxlength="60" value="${esc(S.title)}"`)}${field('e-cta', 'نص الزر', `maxlength="24" value="${esc(S.cta)}"`)}</div>
    ${field('e-tag', 'العبارة تحت العنوان', `maxlength="90" value="${esc(S.tagline)}"`)}
    <div><label class="lbl" for="e-about">نبذة عن المتجر</label><textarea class="field" id="e-about" rows="3" maxlength="500">${esc(S.about)}</textarea></div>
    ${field('e-wa', 'رقم واتساب (اختياري)', `type="tel" dir="ltr" value="${esc(S.whatsapp)}"`, 'بيظهر زر تواصل عائم وقسم تواصل')}
    <div class="fgrid" style="grid-template-columns:repeat(3,1fr)">${[['e-brand', 'اللون الأساسي', S.brand], ['e-accent', 'لون التمييز', S.accent], ['e-bg', 'الخلفية', S.bg]].map(([i, l, v]) => `<div><label class="lbl" for="${i}">${l}</label><input class="field clr" type="color" id="${i}" value="${esc(v)}"></div>`).join('')}</div>
    ${imageField('e-hero', S.hero, 'الصورة الرئيسية')}${imageField('e-logo', S.logo, 'الشعار')}
    <label class="chk"><input type="checkbox" id="e-prod" ${S.products !== false ? 'checked' : ''}> عرض منتجاتي في الموقع <small>(المنتجات المعتمدة فقط، مع البحث والأقسام والعروض)</small></label>
    <p id="err" class="alert" hidden></p>${saveBar(site)}</form>${previewBox('pv')}</div>`;
  bindImage(el, 'e-hero', c.user.id); bindImage(el, 'e-logo', c.user.id);
  const show = bindPreview(el, 'pv', data);
  const read = () => ({ brand: $('#e-brand').value, accent: $('#e-accent').value, bg: $('#e-bg').value, title: $('#e-title').value.trim(), tagline: $('#e-tag').value.trim(), about: $('#e-about').value.trim(), cta: $('#e-cta').value.trim(), hero: $('#e-hero').value.trim(), logo: $('#e-logo').value.trim(), whatsapp: $('#e-wa').value.trim(), products: $('#e-prod').checked });
  const draw = () => { tid = $('#e-tpl').value; show(siteDoc(tid, read(), c.store)); };
  const dd = deb(draw, 250); const f = $('#f'); f.addEventListener('input', dd); f.addEventListener('change', dd);
  $('#e-hero-pv').addEventListener('load', dd); $('#e-logo-pv').addEventListener('load', dd);   // بعد رفع صورة
  draw();
  const save = async pub => {
    const err = $('#err'); err.hidden = true; const s = read();
    if (s.title.length < 2) { err.textContent = 'اكتب اسم المتجر'; err.hidden = false; return; }
    if (s.hero && !/^https:\/\//i.test(s.hero)) { err.textContent = 'رابط الصورة لازم يبدأ بـ https://'; err.hidden = false; return; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = true);
    try { tid = $('#e-tpl').value; published = pub ? true : published; await putSite(c, { mode: 'template', template_id: tid, settings: s, html: siteDoc(tid, s, c.store), css: '', js: '', published }); toast(pub ? 'تم الحفظ والنشر' : 'تم الحفظ كمسودة'); $('#sv-st').textContent = `آخر حفظ الآن${published ? ' · منشور' : ' · مسودة'}`; } catch (e) { err.textContent = e.message; err.hidden = false; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = false);
  };
  f.onsubmit = e => e.preventDefault(); $('#sv-d').onclick = () => save(false); $('#sv-p').onclick = () => save(true);
};

/* ===================== #page-premium-codeyo: مدخل طريق الكود ===================== */
// #page-premium-codeyo #route #seller #premium #code-yo
pages.premCodeYo = async (el, c) => {
  const site = await getSite(c);
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['بالكود']]) + pgh('ابنِ متجرك بالكود', 'موقعك بيشتغل جوه إطار معزول، فمفيش كود يقدر يوصل لبيانات لوحتك. منتجاتك والسلة متاحين عن طريق window.KITCHENLY.') +
    `<div class="choose"><a class="choice" data-l href="${PREM.write}"><span class="choice__i">${ic('code', 'lg')}</span><h3>اكتب وأنشئ</h3><p>محرر لـ HTML و CSS و JavaScript مع معاينة مباشرة للموبايل والكمبيوتر.</p>${site?.mode === 'code' ? badge('b-ok', 'موقعك الحالي') : ''}<b class="btn btn-p">افتح المحرر</b></a>
    <a class="choice" data-l href="${PREM.upload}"><span class="choice__i">${ic('up', 'lg')}</span><h3>ارفع ملفاتك</h3><p>ارفع index.html مع ملفات css و js، أو ملف zip فيه موقعك كله.</p>${site?.mode === 'upload' ? badge('b-ok', 'موقعك الحالي') : ''}<b class="btn btn-g">ارفع الملفات</b></a></div>`;
};

/* ===================== #page-premium-write: الكتابة والإنشاء ===================== */
// #page-premium-write #route #seller #premium #write-and-create
const STARTER = {
  html: `<header class="top">\n  <h1 id="name"></h1>\n  <button class="cta" id="cart">السلة <b id="n" hidden>0</b></button>\n</header>\n\n<main>\n  <section class="intro">\n    <h2>اكتب هنا عنوان يشدّ العميل</h2>\n    <p>جملة قصيرة تشرح إنت بتبيع إيه وليه يشتري منك.</p>\n  </section>\n  <section>\n    <h3>منتجاتنا</h3>\n    <div id="grid" class="grid"></div>\n  </section>\n</main>\n\n<footer>© <span id="yr"></span> كل الحقوق محفوظة</footer>`,
  css: `body{margin:0;font-family:system-ui,Tahoma,sans-serif;background:#f7f5ee;color:#17261d;line-height:1.7}\n.top{display:flex;justify-content:space-between;align-items:center;padding:16px 6vw}\n.cta{background:#2f7d4a;color:#fff;border:0;padding:8px 18px;border-radius:99px;font:inherit;cursor:pointer}\n.cta b{background:#f2b705;color:#222;border-radius:99px;padding:0 7px;margin-inline-start:6px}\nmain{padding:2vw 6vw}\n.intro h2{font-size:clamp(1.8rem,5vw,3rem);margin:0 0 8px}\n.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}\n.p{background:#fff;border-radius:16px;overflow:hidden;display:grid}\n.p img{width:100%;aspect-ratio:1;object-fit:cover}\n.p div{padding:12px;display:grid;gap:6px}\n.p button{border:0;background:#2f7d4a;color:#fff;border-radius:10px;padding:8px;font:inherit;cursor:pointer}\nfooter{padding:24px;text-align:center;opacity:.6}`,
  js: `const K = window.KITCHENLY;            // بيانات متجرك ومنتجاتك الحقيقية\n\ndocument.getElementById('name').textContent = K.store.name;\ndocument.getElementById('yr').textContent = new Date().getFullYear();\n\ndocument.getElementById('grid').innerHTML = K.products.map(p => \`\n  <article class="p">\n    <img src="\${p.image}" alt="">\n    <div>\n      <b>\${p.name}</b>\n      <span>\${p.price} جنيه</span>\n      <button data-add="\${p.slug}">أضف للسلة</button>\n      <a href="#" data-open="\${p.slug}">التفاصيل</a>\n    </div>\n  </article>\`).join('');\n\ndocument.addEventListener('click', e => {\n  const a = e.target.closest('[data-add]'), o = e.target.closest('[data-open]');\n  if (a) K.addToCart(a.dataset.add);                       // يضيف للسلة الحقيقية\n  if (o) { e.preventDefault(); K.openProduct(o.dataset.open); }   // يفتح صفحة المنتج\n});\ndocument.getElementById('cart').onclick = () => K.cart();\n\nconst n = document.getElementById('n');\nconst count = c => { n.textContent = c; n.hidden = !c; };\ncount(K.cartCount);\naddEventListener('kitchenly:cart', e => count(e.detail));`
};
const API_DOC = `window.KITCHENLY = {
  store:    { name, slug, logo, cover, description, city },
  products: [{ slug, name, price, old_price, image, images, stock, rating, reviews_count, description, category }],
  shop:     { freeShipFrom, shippingFee },
  cartCount,                       // عدد القطع في السلة
  addToCart(slug, qty = 1),        // يضيف للسلة الحقيقية
  openProduct(slug),               // يفتح صفحة المنتج
  cart(),                          // يفتح صفحة السلة
  goto('/track' | '/policy' | '/shop.html' | '/')
}
// حدث تحديث عدد السلة:
addEventListener('kitchenly:cart', e => console.log(e.detail))`;
pages.premWrite = async (el, c) => {
  const site = await getSite(c), data = await loadBridge(c), S = site?.mode === 'code' ? { html: site.html, css: site.css, js: site.js } : { ...STARTER }; let tab = 'html', published = !!site?.published && site?.mode === 'code';
  const TABS = [['html', 'HTML'], ['css', 'CSS'], ['js', 'JavaScript']];
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['بالكود', PREM.codeYo], ['اكتب وأنشئ']]) + pgh('اكتب وأنشئ', 'اكتب كودك والمعاينة بتتحدّث لوحدها. منتجاتك متاحة في window.KITCHENLY.') +
    `<div class="pe pe--wide"><div class="card pe__f"><div class="chips" role="tablist">${TABS.map(([k, t]) => `<button class="chip" role="tab" data-t="${k}" aria-pressed="${k === tab}">${t}</button>`).join('')}</div>
    <textarea class="field code" id="ed" dir="ltr" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea><div class="sub" id="cnt" dir="ltr"></div>
    <details class="faq"><summary>مرجع الربط بمنتجاتك والسلة</summary><pre class="apidoc" dir="ltr">${esc(API_DOC)}</pre></details><p id="err" class="alert" hidden></p>${saveBar(site?.mode === 'code' ? site : null)}</div>${previewBox('pv')}</div>`;
  const show = bindPreview(el, 'pv', data), ed = $('#ed'), draw = () => show(compose(S)), dd = deb(draw, 350);
  const load = () => { ed.value = S[tab]; $('#cnt').textContent = `${S[tab].length.toLocaleString('en-US')} / ${LIM[tab].toLocaleString('en-US')}`; $$('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tab)); };
  $$('[data-t]').forEach(b => b.onclick = () => { S[tab] = ed.value; tab = b.dataset.t; load(); ed.focus(); });
  ed.addEventListener('input', () => { S[tab] = ed.value; $('#cnt').textContent = `${ed.value.length.toLocaleString('en-US')} / ${LIM[tab].toLocaleString('en-US')}`; dd(); });
  ed.addEventListener('keydown', e => { if (e.key !== 'Tab') return; e.preventDefault(); const a = ed.selectionStart; ed.setRangeText('  ', a, ed.selectionEnd, 'end'); ed.dispatchEvent(new Event('input')); });
  load(); draw();
  const save = async pub => {
    const err = $('#err'); err.hidden = true; S[tab] = ed.value;
    const over = Object.keys(LIM).find(k => S[k].length > LIM[k]); if (over) { err.textContent = `ملف ${over.toUpperCase()} أكبر من الحد المسموح`; err.hidden = false; return; }
    if (!S.html.trim()) { err.textContent = 'اكتب HTML الأول'; err.hidden = false; return; }
    if (!(await confirmReplace(site, 'code'))) return;
    $$('#sv-d,#sv-p').forEach(b => b.disabled = true);
    try { published = pub ? true : published; await putSite(c, { mode: 'code', template_id: null, html: S.html, css: S.css, js: S.js, published }); toast(pub ? 'تم الحفظ والنشر' : 'تم الحفظ كمسودة'); $('#sv-st').textContent = `آخر حفظ الآن${published ? ' · منشور' : ' · مسودة'}`; } catch (e) { err.textContent = e.message; err.hidden = false; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = false);
  };
  $('#sv-d').onclick = () => save(false); $('#sv-p').onclick = () => save(true);
};

/* ===================== #page-premium-upload: رفع الملفات ===================== */
// #page-premium-upload #route #seller #premium #upload #zip
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif' };
const isLocal = u => !/^(https?:)?\/\//i.test(u) && !/^(data|mailto|tel|#)/i.test(u);
const ext = n => (n.split('.').pop() || '').toLowerCase();
const loadJSZip = () => window.JSZip ? Promise.resolve(window.JSZip) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload = () => res(window.JSZip); s.onerror = () => rej(new Error('تعذر تحميل مكتبة الـ zip، تأكد من الاتصال')); document.head.appendChild(s); });
const toDataUri = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
async function ingest(files) {
  const htmls = [], css = [], js = [], imgs = [], notes = [], list = [];
  const take = async (name, getText, getBlob) => {
    const e = ext(name), base = name.split('/').pop();
    if (/^(__MACOSX|\.)/.test(base) || name.includes('__MACOSX/')) return;
    if (e === 'html' || e === 'htm') { htmls.push({ name, text: await getText() }); list.push(name); }
    else if (e === 'css') { css.push(await getText()); list.push(name); }
    else if (e === 'js') { js.push(await getText()); list.push(name); }
    else if (MIME[e] && getBlob) { const b = await getBlob(); if (b.size <= 200 * 1024) { imgs.push({ name, blob: b, e }); list.push(name); } else notes.push(`الصورة ${base} أكبر من 200 كيلو، استخدم رابط https بدلها`); }
  };
  for (const f of files) {
    if (ext(f.name) === 'zip') {
      const Z = await loadJSZip(), z = await Z.loadAsync(f);
      for (const [n, en] of Object.entries(z.files)) if (!en.dir) await take(n, () => en.async('string'), async () => new Blob([await en.async('arraybuffer')], { type: MIME[ext(n)] }));
    } else await take(f.name, () => f.text(), () => Promise.resolve(f));
  }
  if (!htmls.length) throw new Error('مفيش ملف HTML في اللي رفعته');
  htmls.sort((a, b) => (/(^|\/)index\.html?$/i.test(b.name) ? 1 : 0) - (/(^|\/)index\.html?$/i.test(a.name) ? 1 : 0) || a.name.split('/').length - b.name.split('/').length);
  if (htmls.length > 1) notes.push(`استخدمنا ${htmls[0].name} كصفحة رئيسية وتجاهلنا باقي صفحات HTML (${htmls.length - 1})`);
  let html = htmls[0].text, style = css.join('\n'), script = js.join('\n');
  html = html.replace(/<link\b[^>]*>/gi, t => { if (!/rel=["']?stylesheet/i.test(t)) return t; const m = t.match(/href=["']([^"']+)["']/i); return m && isLocal(m[1]) ? '' : t; }).replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (t, u) => (isLocal(u) ? '' : t));
  for (const im of imgs) { const uri = await toDataUri(im.blob), n = im.name.replace(/^\.?\//, ''), names = [...new Set([n, n.split('/').slice(1).join('/'), n.split('/').pop()].filter(Boolean))]; for (const nm of names) for (const pre of ['', './', '/']) { const p = pre + nm; html = html.split(p).join(uri); style = style.split(p).join(uri); } }
  const left = (html.match(/(?:src|href)=["'](?!https?:|\/\/|data:|#|mailto:|tel:)[^"']+/gi) || []).length; if (left) notes.push('فيه روابط محلية لم نجد ملفاتها داخل الرفع، ممكن ما تظهرش في الموقع');
  return { html, css: style, js: script, list, notes };
}
pages.premUpload = async (el, c) => {
  const site = await getSite(c), data = await loadBridge(c); let S = site?.mode === 'upload' ? { html: site.html, css: site.css, js: site.js } : null, published = !!site?.published && site?.mode === 'upload';
  el.innerHTML = crumbs([['البريميوم'], ['ابنِ متجرك', PREM.build], ['بالكود', PREM.codeYo], ['ارفع ملفاتك']]) + pgh('ارفع ملفاتك', 'index.html مع ملفات css و js، أو ملف zip واحد. وكودك يقدر يستخدم window.KITCHENLY للمنتجات والسلة.') +
    `<div class="pe pe--wide"><div class="card pe__f"><label class="drop" id="dz"><input type="file" id="fl" accept=".html,.htm,.css,.js,.zip,.png,.jpg,.jpeg,.gif,.webp,.svg,.avif" multiple hidden>${ic('up', 'lg')}<b>اسحب الملفات هنا أو اضغط للاختيار</b><span class="sub">HTML · CSS · JS · ZIP · صور حتى 200 كيلو للصورة</span></label>
    <ul class="rows" id="fls" hidden></ul><div id="nts"></div><div class="alert alert--info" style="font-size:.82rem">الصور الصغيرة اللي داخل الـ zip بتتدمج في الصفحة تلقائيًا. للصور الأكبر استخدم روابط https. أي ملف css أو js محلي بيتدمج في الصفحة. مرجع الربط بالمنتجات والسلة في صفحة «اكتب وأنشئ».</div><p id="err" class="alert" hidden></p>${saveBar(site?.mode === 'upload' ? site : null)}</div>${previewBox('pv')}</div>`;
  const show = bindPreview(el, 'pv', data), err = $('#err'), draw = () => S && show(compose(S)); draw();
  const run = async files => {
    err.hidden = true; if (![...files].length) return; $('#dz').classList.add('busy');
    try { const r = await ingest([...files]); const tot = { html: r.html.length, css: r.css.length, js: r.js.length }, over = Object.keys(LIM).find(k => tot[k] > LIM[k]); if (over) throw new Error(`حجم ${over.toUpperCase()} بعد الدمج أكبر من الحد المسموح`); S = { html: r.html, css: r.css, js: r.js }; const ul = $('#fls'); ul.hidden = false; ul.innerHTML = r.list.slice(0, 40).map(n => `<li><span dir="ltr">${esc(n)}</span><b>${ic('check', 'sm')}</b></li>`).join('') + (r.list.length > 40 ? `<li><span>و ${r.list.length - 40} ملف آخر</span></li>` : ''); $('#nts').innerHTML = r.notes.map(n => `<p class="alert alert--warn" style="margin-bottom:8px">${esc(n)}</p>`).join(''); draw(); }
    catch (e) { err.textContent = e.message || 'تعذر قراءة الملفات'; err.hidden = false; }
    $('#dz').classList.remove('busy');
  };
  $('#fl').onchange = e => { run(e.target.files); e.target.value = ''; };
  const dz = $('#dz'); ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove('over'))); dz.addEventListener('drop', e => { e.preventDefault(); run(e.dataTransfer.files); });
  const save = async pub => {
    err.hidden = true; if (!S) { err.textContent = 'ارفع ملفات موقعك الأول'; err.hidden = false; return; }
    if (!(await confirmReplace(site, 'upload'))) return;
    $$('#sv-d,#sv-p').forEach(b => b.disabled = true);
    try { published = pub ? true : published; await putSite(c, { mode: 'upload', template_id: null, html: S.html, css: S.css, js: S.js, published }); toast(pub ? 'تم الحفظ والنشر' : 'تم الحفظ كمسودة'); $('#sv-st').textContent = `آخر حفظ الآن${published ? ' · منشور' : ' · مسودة'}`; } catch (e) { err.textContent = e.message; err.hidden = false; }
    $$('#sv-d,#sv-p').forEach(b => b.disabled = false);
  };
  $('#sv-d').onclick = () => save(false); $('#sv-p').onclick = () => save(true);
};

Object.assign(NS, { PREM, isPremium, premiumLocked });
})();
