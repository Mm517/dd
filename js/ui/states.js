/* =====================================================================
 * js/ui/states.js
 * الوظيفة: صناديق الحالات (خطأ، لا توجد منتجات، فارغ) وتسميات حالات الطلب وطرق الدفع.
 * يعتمد على: js/core/utils.js [esc]
 * يعرض على window.KTApp: errorBox, stateImg, NOPROD_SVG, noProducts, emptyBox, STATUS, PAYNAME
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { esc } = NS;   // js/core/utils.js

/* ===================== #empty-state: صناديق الخطأ والحالات الفاضية وتسميات الحالات ===================== */
// #empty-state #error-box #order-status #payment-names
const errorBox = (msg = 'تعذر تحميل البيانات. تحقق من الاتصال ثم حاول مرة أخرى.') => `<div class="card empty"><p>${esc(msg)}</p><button class="btn btn-ghost" onclick="location.reload()">إعادة المحاولة</button></div>`;
/* صور الحالات الفاضية: kind = cart | search | orders | notfound | imgsearch */
const STATE_IMG = { cart: 'empty-cart', search: 'no-results', orders: 'no-results', notfound: '404', imgsearch: 'image-search' };
const stateImg = kind => (STATE_IMG[kind] ? `<img class="empty__img empty__img--${kind}" src="/assets/img/states/${STATE_IMG[kind]}.webp" alt="" loading="lazy" decoding="async">` : '');
/* لو المنتجات ما اتحملتش (مشكلة اتصال/سيرفر) أو القسم فاضي: أيقونة "لا توجد منتجات". لو ملف الصورة مش موجود بيظهر رسم SVG بديل. */
const NOPROD_SVG = '<svg class="empty__img empty__img--noproducts" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 40 60 16l46 24v44L60 108 14 84z"/><path d="M14 40l46 24 46-24M60 64v44"/><path d="M42 28l46 24" stroke-dasharray="2 7"/></svg>';
const noProducts = (msg = 'لا توجد منتجات متاحة الآن.', retry = true) => `<div class="card empty empty--noproducts"><img class="empty__img empty__img--noproducts" src="/assets/img/states/no-products.webp" alt="" loading="lazy" decoding="async" onerror="this.outerHTML=window.KTApp.NOPROD_SVG"><p>${esc(msg)}</p>${retry ? '<button class="btn btn-ghost" onclick="location.reload()">إعادة المحاولة</button>' : ''}</div>`;
const emptyBox = (msg, href = '/shop.html', label = 'تصفح المنتجات', kind = '') => `<div class="card empty">${stateImg(kind)}<p>${esc(msg)}</p>${href ? `<a class="btn btn-primary" href="${href}">${label}</a>` : ''}</div>`;
const STATUS = { new: 'تم استلام الطلب', confirmed: 'تم التأكيد', shipping: 'الأوردر في الطريق', delivered: 'المندوب وصل', cancelled: 'ملغي' };
const PAYNAME = { cod: 'عند الاستلام', wallet: 'محفظة إلكترونية', online: 'دفع أونلاين', instapay: 'إنستا باي' };

Object.assign(NS, { errorBox, stateImg, NOPROD_SVG, noProducts, emptyBox, STATUS, PAYNAME });
})();
