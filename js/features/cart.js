/* =====================================================================
 * js/features/cart.js
 * الوظيفة: السلة المحفوظة في localStorage (إضافة/حذف/تعديل/إجمالي) وشارة العدد وحساب الشحن.
 * يعتمد على: js/core/utils.js [K, $$] · js/ui/cart-fx.js [bumpCart] (استدعاء متأخر)
 * يعرض على window.KTApp: Cart, shipping, badge
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K, $$ } = NS;   // js/core/utils.js
/* مراجع للأمام: بتتنادى وقت الاستخدام فقط (الملف ده بيتحمّل قبل js/ui/cart-fx.js) */
const bumpCart = (...args) => NS.bumpCart(...args);

/* ===================== #cart: إضافة وحذف المنتجات وحساب الشحن ===================== */
// #cart #add-item #localstorage #shipping

const Cart = {
  read() { try { return JSON.parse(localStorage.getItem('kt_cart') || '[]'); } catch { return []; } },
  write(v) { try { localStorage.setItem('kt_cart', JSON.stringify(v)); } catch { /* التخزين محجوب */ } badge(); },
  add(p, q = 1) {
    const c = this.read(), max = Math.min(p.stock ?? 20, 20), i = c.find(x => x.slug === p.slug);
    if (i) i.qty = Math.min(i.qty + q, max); else c.push({ slug: p.slug, name: p.name, price: +p.price, image: p.image, stock: p.stock, qty: Math.min(q, max) });
    this.write(c);
  },
  set(slug, q) { const c = this.read(), i = c.find(x => x.slug === slug); if (!i) return; i.qty = Math.max(1, Math.min(q, i.stock ?? 20, 20)); this.write(c); },
  remove(slug) { this.write(this.read().filter(x => x.slug !== slug)); },
  clear() { this.write([]); },
  count() { return this.read().reduce((a, x) => a + x.qty, 0); },
  subtotal() { return this.read().reduce((a, x) => a + x.price * x.qty, 0); }
};
const shipping = sub => (sub >= K.freeShipFrom || sub === 0 ? 0 : K.shippingFee);
let lastCartN = null;   /* لتحديد إن العدد زاد (يعني تمت إضافة منتج) فنعمل bounce للأيقونة */
function badge() {
  const n = Cart.count(); $$('[data-cart-count]').forEach(el => { el.textContent = n; el.hidden = !n; });
  if (lastCartN !== null && n > lastCartN) bumpCart();
  lastCartN = n;
}

Object.assign(NS, { Cart, shipping, badge });
})();
