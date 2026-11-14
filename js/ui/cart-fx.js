/* =====================================================================
 * js/ui/cart-fx.js
 * الوظيفة: زر "أضف للسلة": ربط الضغط، نبضة الزر، الصورة الطايرة للسلة، و bounce للأيقونة.
 * يعتمد على: js/core/utils.js [$$, esc] · js/ui/toast.js [toast] · js/features/cart.js [Cart] · js/core/data.js [PC] · js/ui/card-motion.js [MOTION]
 * يعرض على window.KTApp: bumpCart
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $$, esc } = NS;   // js/core/utils.js
const { toast } = NS;   // js/ui/toast.js
const { Cart } = NS;   // js/features/cart.js
const { PC } = NS;   // js/core/data.js
const { MOTION } = NS;   // js/ui/card-motion.js

/* ===================== #add-to-cart: ربط زر الإضافة للسلة (event delegation) ===================== */
// #add-to-cart #cart #click

document.addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const p = PC[b.dataset.add]; if (!p) return;
  if (p.stock < 1) return toast('المنتج غير متوفر حاليًا', 'err');
  flyToCart(b); Cart.add(p); toast('تمت إضافة المنتج إلى السلة'); pulseBtn(b); doneBtn(b);
});

/* ===================== #cart-fx: نبضة الزر والصورة الطايرة وbounce السلة ===================== */
// #cart-fx #fly-to-cart #animation

/* نبضة الزر + bounce لأيقونة السلة */
function pulseBtn(b) {
  if (!MOTION || !b) return;
  b.classList.remove('is-pulse'); void b.offsetWidth; b.classList.add('is-pulse');
  setTimeout(() => b.classList.remove('is-pulse'), 700);
}
let flyWait = false;   /* لو في صورة طايرة للسلة، الـ bounce يستنى لحد ما توصل */
/* تغيير نص الزر مؤقتًا بعد الإضافة */
function doneBtn(b) {
  if (!b || b.disabled) return;
  if (b._t) clearTimeout(b._t); else b._txt = b.textContent;
  b.textContent = '✓ تمت الإضافة'; b.classList.add('is-done');
  b._t = setTimeout(() => { b.textContent = b._txt; b.classList.remove('is-done'); b._t = null; }, 1400);
}
/* صورة المنتج بتطير لأيقونة السلة (transform + opacity فقط) */
function flyToCart(b) {
  if (!MOTION || !b.animate) return;
  const card = b.closest('.pcard'), src = card?.querySelector('.pcard__img>img');
  const to = $$('[data-cart-count]').map(el => el.closest('a,button')).filter(Boolean).map(h => h.getBoundingClientRect()).find(r => r.width && r.height);
  const from = (src && src.naturalWidth ? src : b).getBoundingClientRect();
  if (!to || !from.width) return;
  const size = 64, g = document.createElement('div');
  g.className = 'fly-ghost'; g.style.cssText = `width:${size}px;height:${size}px;left:${from.left + from.width / 2 - size / 2}px;top:${from.top + from.height / 2 - size / 2}px`;
  if (src && src.naturalWidth) g.innerHTML = `<img src="${esc(src.currentSrc || src.src)}" alt="">`;
  document.body.appendChild(g);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
  flyWait = true;
  const a = g.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * .55}px,${dy * .55 - 40}px) scale(.7)`, opacity: .95, offset: .55 },
    { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: .2 }
  ], { duration: 750, easing: 'cubic-bezier(.45,.05,.55,.95)' });
  const end = () => { g.remove(); flyWait = false; bumpCart(true); };
  a.onfinish = end; a.oncancel = end;
}
function bumpCart(force) {
  if (!MOTION || (flyWait && !force)) return;
  const hosts = new Set($$('[data-cart-count]').map(el => el.closest('a,button')).filter(Boolean));
  hosts.forEach(h => { h.classList.remove('cart-bump'); void h.offsetWidth; h.classList.add('cart-bump'); setTimeout(() => h.classList.remove('cart-bump'), 800); });
}

Object.assign(NS, { bumpCart });
})();
