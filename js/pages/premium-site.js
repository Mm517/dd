/* =====================================================================
 * js/pages/premium-site.js
 * الوظيفة: موقع المتجر البريميوم على domain/<slug>. بيعرض الموقع المنشور (قالب/كود/رفع) في إطار معزول،
 *   ويحقن فيه window.KITCHENLY (بيانات المتجر ومنتجاته الحقيقية + إضافة للسلة وفتح المنتج) عن طريق postMessage.
 *   المتجر العادي (غير البريميوم) يفضل على /store/<slug>.
 * يعتمد على: js/core/data.js [db] · js/core/supabase.js [sb] · js/features/cart.js [Cart, badge] · js/ui/toast.js [toast] · js/ui/states.js [emptyBox] · window.KTApp [$, esc, K, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $, esc, K, db, sb, Cart, toast, emptyBox, pages } = NS;

/* ===================== #premium-site: صفحة الموقع البريميوم ===================== */
// #premium-site #page #iframe #bridge #cart
const RESERVED = ['admin', 'stuff', 'be-seller', 'store', 'product', 'category', 'offers', 'shop', 'cart', 'checkout', 'track', 'auth', 'account', 'profile', 'about', 'help', 'privacy', 'policy', 'policies', 'join-us', 'yours-offer', 'contact', 'order-success', 'offline', 'assets', 'css', 'js', 'supabase', 'docs', 'premium-site'];
const abs = u => { u = String(u || ''); return /^https?:/i.test(u) ? u : u ? `${location.origin}/${u.replace(/^\//, '')}` : ''; };
const SANDBOX = 'allow-scripts allow-popups allow-forms allow-modals';
/* نفس سكريبت المعاينة في لوحة البائع (js/seller/premium.js → bridgeScript) */
const bridgeScript = d => `<script>(function(){var d=${JSON.stringify(d).replace(/</g, '\\u003c')};var P=function(m){parent.postMessage(m,'*')};var K=window.KITCHENLY={store:d.store,products:d.products,shop:d.shop,demo:!!d.demo,cartCount:d.cartCount||0,addToCart:function(s,q){P({kt:'add',slug:s,qty:q||1})},openProduct:function(s){P({kt:'open',slug:s})},cart:function(){P({kt:'cart'})},goto:function(u){P({kt:'goto',url:u})}};addEventListener('message',function(e){var m=e.data;if(m&&m.kt==='count'){K.cartCount=m.n;dispatchEvent(new CustomEvent('kitchenly:cart',{detail:m.n}))}});P({kt:'ready'})})();<\/script>`;
const withBridge = (html, d) => { const b = bridgeScript(d); return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + b) : /<html[^>]*>/i.test(html) ? html.replace(/<html[^>]*>/i, m => `${m}<head>${b}</head>`) : b + html; };
const compose = ({ html = '', css = '', js = '' }) => {
  const sty = css.trim() ? `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>` : '', scr = js.trim() ? `<script>${js.replace(/<\/script/gi, '<\\/script')}<\/script>` : '';
  if (/<html[\s>]/i.test(html)) { const d = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, () => `${sty}</head>`) : sty + html; return /<\/body>/i.test(d) ? d.replace(/<\/body>/i, () => `${scr}</body>`) : d + scr; }
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${sty}</head><body>${html}${scr}</body></html>`;
};
/* صفحات الموقع الرئيسي المسموح للموقع البريميوم يفتحها */
const GOTO = { '/': '/', '/track': '/track', '/policy': '/policy', '/shop.html': '/shop.html', '/cart.html': '/cart.html', '/help': '/help' };

pages.premiumSite = async () => {
  const app = $('#app'), slug = location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  app.innerHTML = '<div class="psx psx--load"><div class="skel" style="height:100vh"></div></div>';
  const notFound = () => { document.title = 'الصفحة غير موجودة | Kitchenly'; app.innerHTML = `<div class="wrap page" style="padding-top:48px">${emptyBox('لم نجد هذه الصفحة. ربما تغير رابطها أو تم إيقافها.', '/', 'الرئيسية', 'notfound')}</div>`; };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || RESERVED.includes(slug)) return notFound();
  const st = await db.store(slug).catch(() => null); if (!st) return notFound();
  /* مسموح للعامة بس لو المتجر بريميوم + الموقع منشور (RLS). غير كده يرجع لصفحة المتجر العادية */
  const { data: site } = await sb.from('kt_store_sites').select('html,css,js').eq('store_id', st.id).eq('published', true).maybeSingle();
  if (!site?.html) return location.replace(`/store/${slug}`);
  const prods = await db.byStore(st.id).catch(() => []);
  const data = {
    store: { name: st.name, slug: st.slug, logo: abs(st.logo), cover: abs(st.cover), description: st.description || '', city: st.city || '' },
    products: prods.map(p => ({ slug: p.slug, name: p.name, price: +p.price, old_price: +p.old_price || 0, image: abs(p.image), images: (Array.isArray(p.images) ? p.images : []).map(abs), stock: p.stock, rating: +p.rating || 0, reviews_count: p.reviews_count || 0, description: p.short_desc || '', category: p.category?.name || '' })),
    shop: { freeShipFrom: K.freeShipFrom, shippingFee: K.shippingFee }, cartCount: Cart.count()
  };
  document.title = `${st.name} | Kitchenly`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', (st.description || `تسوّق من ${st.name} على Kitchenly`).slice(0, 160));
  if (st.logo) document.querySelector('link[rel="icon"]')?.setAttribute('href', abs(st.logo));
  app.innerHTML = `<div class="psx"><div class="psx__bar"><a href="/" class="psx__brand" aria-label="Kitchenly"><img src="/assets/img/logo-mark.jpg" alt=""><span>Kitchenly</span></a><span class="psx__sp"></span><a href="/track">تتبّع طلبك</a><a href="/cart.html" class="psx__cart">السلة <b data-cart-count hidden>0</b></a></div><iframe class="psx__f" title="${esc(st.name)}" sandbox="${SANDBOX}"></iframe></div>`;
  const frame = $('.psx__f'); frame.srcdoc = withBridge(compose(site), data);
  const sendCount = () => frame.contentWindow?.postMessage({ kt: 'count', n: Cart.count() }, '*');
  window.addEventListener('message', e => {
    if (e.source !== frame.contentWindow) return; const m = e.data || {};
    if (m.kt === 'ready') sendCount();
    else if (m.kt === 'add') {
      const p = NS.PC?.[String(m.slug)]; if (!p || p.store_id !== st.id) return;
      if (p.stock < 1) return toast('المنتج غير متوفر حاليًا', 'err');
      Cart.add(p, Math.max(1, Math.min(20, parseInt(m.qty, 10) || 1))); toast('تمت إضافة المنتج إلى السلة'); sendCount();
    } else if (m.kt === 'open') { const p = NS.PC?.[String(m.slug)]; if (p && p.store_id === st.id) location.href = `/product/${p.slug}`; }
    else if (m.kt === 'cart') location.href = '/cart.html';
    else if (m.kt === 'goto' && GOTO[String(m.url)]) location.href = GOTO[String(m.url)];
  });
  window.addEventListener('storage', sendCount);
};
})();
