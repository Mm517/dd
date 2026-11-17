/* =====================================================================
 * js/pages/premium-site.js
 * الوظيفة: موقع المتجر البريميوم على domain/<slug> كصفحة عادية جوه موقع Kitchenly (بالهيدر والفوتر والسلة)، مش iframe.
 *   وضع القالب: بيتعرض بشكل مميز بألوان البائع (js/shared/premium-store.js). وضع الكود/الرفع: HTML و CSS بعد التنضيف في shadow DOM (بدون JavaScript).
 *   المتجر العادي (غير البريميوم) يفضل على /store/<slug>.
 * يعتمد على: js/shared/premium-store.js [KTPremium] · js/core/data.js [db, PC] · js/core/supabase.js [sb] · js/features/cart.js [Cart] · js/ui/toast.js [toast] · js/ui/states.js [emptyBox] · js/ui/header.js [setHashtag] · window.KTApp [$, esc, K, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $, K, db, sb, Cart, toast, emptyBox, pages, setHashtag } = NS;

/* ===================== #premium-site: صفحة الموقع البريميوم ===================== */
// #premium-site #page #template #no-iframe
const RESERVED = ['admin', 'stuff', 'be-seller', 'store', 'product', 'category', 'offers', 'shop', 'cart', 'checkout', 'track', 'auth', 'account', 'profile', 'about', 'help', 'privacy', 'policy', 'policies', 'join-us', 'yours-offer', 'contact', 'order-success', 'offline', 'assets', 'css', 'js', 'supabase', 'docs', 'premium-site', 'premuim'];
const abs = u => { u = String(u || ''); return /^https?:/i.test(u) ? u : u ? `${location.origin}/${u.replace(/^\//, '')}` : ''; };

pages.premiumSite = async () => {
  const app = $('#app'), slug = location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  app.innerHTML = '<div class="skel" style="height:70vh;border-radius:0"></div>';
  const notFound = () => { document.title = 'الصفحة غير موجودة | Kitchenly'; app.innerHTML = `<div class="wrap page" style="padding-top:48px">${emptyBox('لم نجد هذه الصفحة. ربما تغير رابطها أو تم إيقافها.', '/', 'الرئيسية', 'notfound')}</div>`; };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || RESERVED.includes(slug)) return notFound();
  const st = await db.store(slug).catch(() => null); if (!st) return notFound();
  /* مسموح للعامة بس لو المتجر بريميوم + الموقع منشور (RLS). غير كده يرجع لصفحة المتجر العادية */
  const { data: site } = await sb.from('kt_store_sites').select('mode,template_id,settings,html,css').eq('store_id', st.id).eq('published', true).maybeSingle();
  const classic = () => location.replace(`/store/${slug}?classic=1`);
  if (!site || (site.mode !== 'template' && !site.html)) return classic();
  const prods = await db.byStore(st.id).catch(() => []);
  const data = {
    store: { name: st.name, slug: st.slug, logo: abs(st.logo), cover: abs(st.cover), description: st.description || '', city: st.city || '' },
    products: prods.map(p => ({ slug: p.slug, name: p.name, price: +p.price, old_price: +p.old_price || 0, image: abs(p.image), images: (Array.isArray(p.images) ? p.images : []).map(abs), stock: p.stock, rating: +p.rating || 0, reviews_count: p.reviews_count || 0, description: p.short_desc || '', category: p.category?.name || '' })),
    shop: { freeShipFrom: K.freeShipFrom, shippingFee: K.shippingFee }
  };
  document.title = `${st.name} | Kitchenly`; setHashtag(`#${st.name.trim().replace(/\s+/g, '_')}`);
  document.querySelector('meta[name="description"]')?.setAttribute('content', (st.description || `تسوّق من ${st.name} على Kitchenly`).slice(0, 160));
  if (st.logo) document.querySelector('link[rel="icon"]')?.setAttribute('href', abs(st.logo));
  if (site.mode === 'template') { window.KTPremium.mount(app, { ...data, tid: site.template_id, settings: site.settings || {} }); return; }   /* زر السلة العام (cart-fx) بيشتغل على data-add */
  app.innerHTML = '<div id="ps-host"></div>';
  try {
    await window.KTPremium.mountCustom($('#ps-host'), data, site, {
      onAdd: s => { const p = NS.PC?.[String(s)]; if (!p || p.store_id !== st.id) return; if (p.stock < 1) return toast('المنتج غير متوفر حاليًا', 'err'); Cart.add(p); toast('تمت إضافة المنتج إلى السلة'); }
    });
  } catch (e) { console.error(e); classic(); }
};
})();
