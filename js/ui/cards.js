/* =====================================================================
 * js/ui/cards.js
 * الوظيفة: رسم كارت المنتج والسكلتون وصور المنتج ولوجوهات الدفع، وسكلتون الصور أثناء التحميل.
 * يعتمد على: js/core/utils.js [K, esc, fmt, money, purl] · js/ui/icons.js [stars] · js/ui/card-motion.js [variantOf] (استدعاء متأخر)
 * يعرض على window.KTApp: payLogos, discount, card, imgSrc, imgList, skeletons, skelQuad
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K, esc, fmt, money, purl } = NS;   // js/core/utils.js
const { stars } = NS;   // js/ui/icons.js
/* مراجع للأمام: بتتنادى وقت الاستخدام فقط (الملف ده بيتحمّل قبل js/ui/card-motion.js) */
const variantOf = (...args) => NS.variantOf(...args);

/* ===================== #payment-logos: لوجوهات وسائل الدفع ===================== */
// #payment-logos #payments

/* لوجوهات وسائل الدفع */
const PAYALT = { instapay: 'InstaPay', paymob: 'Paymob', visa: 'Visa' };
const payLogos = (keys, cls = '') => `<span class="paylogos ${cls}">${keys.map(k => `<img src="/assets/img/pay/${k}.webp" alt="${PAYALT[k]}" loading="lazy" decoding="async">`).join('')}</span>`;

/* ===================== #product-card: بطاقة المنتج والسكلتون وصور المنتج ===================== */
// #product-card #skeleton #imgph #discount

const discount = p => (p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0);
function card(p) {
  const d = discount(p), out = p.stock < 1, low = !out && p.stock <= 10, save = d ? Math.round(p.old_price - p.price) : 0;
  const il = imgList(p).filter(x => x && x !== '/'), has = il.length > 0, multi = il.length > 1, free = p.price >= K.freeShipFrom;
  const v = variantOf(p);
  const rate = p.reviews_count > 0 ? `<div class="pcard__rate" aria-label="تقييم ${p.rating} من 5"><b>${Number(p.rating).toFixed(1)}</b>${stars(p.rating)}<span>(${fmt(p.reviews_count)})</span></div>` : '<div class="pcard__rate"><span class="newtag">جديد، لا تقييمات بعد</span></div>';
  const tag = out ? '<span class="pcard__tag pcard__tag--out">غير متوفر</span>' : d >= 15 ? `<span class="pcard__tag pcard__tag--deal">عرض محدود</span>` : p.badge ? `<span class="pcard__tag">${esc(p.badge)}</span>` : '';
  return `<article class="pcard pcard--v${v}" data-v="${v}"><div class="pcard__media"><a href="${purl(p)}" class="pcard__img imgph${has ? '' : ' ld is-noimg'}${multi ? ' is-multi' : ''}" ${multi ? `data-imgs="${esc(JSON.stringify(il))}"` : ''} tabindex="-1" aria-hidden="true">${has ? `<img src="${esc(il[0])}" alt="" loading="lazy" decoding="async">` : ''}${multi ? `<span class="pcard__dots" aria-hidden="true">${il.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</span>` : ''}</a>${d ? `<span class="pcard__off">-${d}%</span>` : ''}</div>
  <div class="pcard__body">${tag}<a href="${purl(p)}" class="pcard__name">${esc(p.name)}</a>${rate}
  <div class="price"><b>${fmt(p.price)}<small>جنيه</small></b>${d ? `<s>${money(p.old_price)}</s>` : ''}</div>
  <ul class="pcard__meta">${save ? `<li class="is-save">وفّر ${fmt(save)} جنيه</li>` : ''}<li class="${free ? 'is-free' : ''}">${free ? 'شحن مجاني' : `شحن مجاني فوق ${fmt(K.freeShipFrom)} جنيه`}</li>${low ? `<li class="is-low">متبقي ${p.stock} قطع فقط</li>` : ''}</ul>
  <button class="btn btn-primary btn-block pcard__add" data-add="${esc(p.slug)}" ${out ? 'disabled' : ''}>${out ? 'غير متوفر' : 'أضف للسلة'}</button></div></article>`;
}
const imgSrc = p => (/^https?:/.test(p.image || '') ? p.image : `/${String(p.image || '').replace(/^\//, '')}`);
/* كل صور المنتج: الرئيسية أولًا ثم الباقي (عمود images) بدون تكرار */
const imgList = p => { const first = imgSrc(p); const rest = (Array.isArray(p.images) ? p.images : []).filter(Boolean).map(x => imgSrc({ image: x })).filter(x => x !== first); return [first, ...new Set(rest)]; };
/* سكلتون بنفس شكل الكارت بالضبط: صورة + اسم + تقييم + سعر + زر */
const skelCard = () => '<div class="pcard pcard--skel" aria-hidden="true"><div class="pcard__media"><div class="pcard__img sk"></div></div><div class="pcard__body"><i class="sk sk--tag"></i><i class="sk sk--l1"></i><i class="sk sk--l2"></i><i class="sk sk--rate"></i><i class="sk sk--price"></i><i class="sk sk--meta"></i><i class="sk sk--btn"></i></div></div>';
const skeletons = (n = 4) => Array.from({ length: n }, skelCard).join('');
const skelQuad = n => Array.from({ length: n }, () => '<div class="qcard qcard--skel" aria-hidden="true"><i class="sk sk--title"></i><div class="qcard__grid">' + '<i class="sk sk--tile"></i>'.repeat(4) + '</div><i class="sk sk--meta"></i></div>').join('');
/* سكلتون لكل صورة: يفضل يلمع لحد ما الصورة تحمّل */
['load', 'error'].forEach(ev => document.addEventListener(ev, e => { const t = e.target; if (t && t.tagName === 'IMG') { const b = t.closest('.imgph'); b?.classList.add('ld'); if (e.type === 'error' && b?.classList.contains('pcard__img')) b.classList.add('is-noimg'); } }, true));

Object.assign(NS, { payLogos, discount, card, imgSrc, imgList, skeletons, skelQuad });
})();
