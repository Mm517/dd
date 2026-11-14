/* =====================================================================
 * js/pages/cart.js
 * الوظيفة: صفحة السلة: تعديل الكميات والحذف وملخص الطلب.
 * يعتمد على: window.KTApp [K, $, esc, money, purl, imgSrc, ic, toast, Cart, shipping, db, emptyBox, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const { K, $, esc, money, purl, imgSrc, ic, toast, Cart, shipping, db, emptyBox, pages } = window.KTApp;

/* ===================== #cart: صفحة السلة ===================== */
// #cart #quantity #summary #localstorage
// #page-cart #route #cart #page
pages.cart = async () => {
  const app = $('#app');
  const draw = () => {
    const items = Cart.read(), sub = Cart.subtotal(), sh = shipping(sub);
    if (!items.length) { app.innerHTML = `<div class="wrap page">${emptyBox('سلتك فارغة حاليًا، ابدأ بإضافة منتجات.', '/shop.html', 'ابدأ التسوق', 'cart')}</div>`; return; }
    const left = Math.max(0, K.freeShipFrom - sub);
    app.innerHTML = `<div class="wrap page"><h1>سلة التسوق</h1><div class="cols" style="margin-top:20px">
    <ul style="display:grid;gap:12px">${items.map(i => `<li class="card line"><a href="${purl(i)}"><img src="${esc(imgSrc(i))}" alt=""></a><div class="line__b"><a href="${purl(i)}" style="font-weight:500">${esc(i.name)}</a><span style="color:var(--muted);font-size:.9rem">${money(i.price)}</span>
      <div class="line__row"><div class="qty"><button data-q="${esc(i.slug)}" data-d="-1" aria-label="تقليل">${ic('minus', 'ico-sm')}</button><span>${i.qty}</span><button data-q="${esc(i.slug)}" data-d="1" aria-label="زيادة">${ic('plus', 'ico-sm')}</button></div>
      <b style="color:var(--green-d)">${money(i.price * i.qty)}</b><button class="icon-btn" data-rm="${esc(i.slug)}" aria-label="حذف ${esc(i.name)}">${ic('trash')}</button></div></div></li>`).join('')}</ul>
    <aside class="card aside"><h2>ملخص الطلب</h2><dl class="rows"><div><dt>المجموع الفرعي</dt><dd>${money(sub)}</dd></div><div><dt>الشحن</dt><dd>${sh ? money(sh) : 'مجاني'}</dd></div><div class="tot"><dt>الإجمالي</dt><dd>${money(sub + sh)}</dd></div></dl>
    <p class="alert ok" style="margin-top:14px">${left ? `أضف منتجات بقيمة ${money(left)} للحصول على شحن مجاني` : 'طلبك مؤهل للشحن المجاني'}</p>
    <a href="/checkout.html" class="btn btn-primary btn-block" style="margin-top:14px">إتمام الطلب</a><a href="/shop.html" class="btn btn-ghost btn-block" style="margin-top:8px">متابعة التسوق</a></aside></div></div>`;
  };
  app.innerHTML = `<div class="wrap page"><div class="skel" style="height:240px"></div></div>`;
  try {
    const items = Cart.read(), fresh = await db.bySlugs(items.map(i => i.slug)), map = Object.fromEntries(fresh.map(p => [p.slug, p]));
    let changed = false; const next = [];
    items.forEach(i => { const p = map[i.slug]; if (!p || p.stock < 1) { changed = true; return; } if (+p.price !== i.price || p.stock < i.qty) changed = true; next.push({ slug: p.slug, name: p.name, price: +p.price, image: p.image, stock: p.stock, qty: Math.min(i.qty, p.stock, 20) }); });
    if (changed) { Cart.write(next); toast('تم تحديث السلة حسب الأسعار والمتاح حاليًا'); }
  } catch (e) { console.error(e); }
  draw();
  app.addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
    if (q) { const i = Cart.read().find(x => x.slug === q.dataset.q); Cart.set(q.dataset.q, i.qty + Number(q.dataset.d)); draw(); }
    if (r) { Cart.remove(r.dataset.rm); draw(); }
  });
};
})();
