/* =====================================================================
 * js/pages/yours.js
 * الوظيفة: صفحة "عروضك" /yours-offer: عروض مرتبة حسب اهتمام العميل.
 * يعتمد على: js/features/reviews.js [readJSON] · window.KTApp [A, sb, $, esc, curl, ic, Cart, db, card, skeletons, errorBox, emptyBox, discount, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const A = window.KTApp;
const { sb, $, esc, curl, ic, Cart, db, card, skeletons, errorBox, emptyBox, discount, pages } = A;
const { readJSON } = NS;   // js/features/reviews.js

/* ===================== #yours-offer: عروضك حسب اهتمامك (السلة، اللي شاهدته، واللي اشتريته) ===================== */
// #yours-offer #personalization #offers
// #page-yours #route #yours-offer #personalization
pages.yours = async () => {
  $('#app').innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span><span>عروضك</span></nav>
  <div style="display:flex;gap:14px;align-items:center"><span class="cat__ic cat__ic--lg">${ic("yours")}</span><div><h1>عروضك</h1><p class="page__sub" id="y-sub">بنجهّز لك أنسب العروض...</p></div></div>
  <div id="y-why" class="chips-row" style="margin-top:16px"></div><div id="y-body" style="margin-top:8px"><div class="grid" style="margin-top:12px">${skeletons(8)}</div></div></div>`;
  const body = $('#y-body'), sub = $('#y-sub');
  try {
    const ses = await A.getSession().catch(() => null);
    const weights = new Map(); const add = (slug, w) => weights.set(slug, (weights.get(slug) || 0) + w);
    Cart.read().forEach(i => add(i.slug, 3)); readJSON('kt_recent', []).forEach(s => add(s, 1));
    if (ses) { const { data } = await sb.from('kt_orders').select('items').eq('user_id', ses.user.id); (data || []).forEach(o => (o.items || []).forEach(i => add(i.slug, 2))); }
    const [sale, seen] = await Promise.all([db.products({ sale: true }), weights.size ? db.bySlugs([...weights.keys()]) : Promise.resolve([])]);
    const catW = new Map(), catName = new Map();
    seen.forEach(p => { const c = p.category?.slug; if (c) { catW.set(c, (catW.get(c) || 0) + (weights.get(p.slug) || 0)); catName.set(c, p.category.name); } });
    if (!sale.length) { sub.textContent = 'لا توجد عروض حاليًا، تابعنا قريبًا.'; body.innerHTML = emptyBox('لا توجد عروض حاليًا.', '/shop.html', 'تصفح المنتجات', 'search'); return; }
    const byDisc = (a, b) => discount(b) - discount(a);
    const fav = sale.filter(p => catW.has(p.category?.slug)).sort((a, b) => (catW.get(b.category.slug) - catW.get(a.category.slug)) || byDisc(a, b));
    const rest = sale.filter(p => !catW.has(p.category?.slug)).sort(byDisc);
    const top = Math.max(...sale.map(discount));
    if (fav.length) {
      sub.textContent = `اخترناها لك حسب اهتمامك، وخصم يصل إلى ${top}%`;
      $('#y-why').innerHTML = `<span style="color:var(--muted);font-size:.85rem">بناءً على اهتمامك بـ:</span>` + [...catW.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => `<a class="chip" href="${curl(s)}" aria-current="false">${esc(catName.get(s))}</a>`).join('');
      body.innerHTML = `<h2 class="subhead">مختارة لك</h2><div class="grid">${fav.map(card).join('')}</div>${rest.length ? `<h2 class="subhead">عروض أخرى قد تعجبك</h2><div class="grid">${rest.map(card).join('')}</div>` : ''}`;
    } else {
      sub.textContent = `أقوى الخصومات الآن، حتى ${top}%. تصفّح المنتجات وسنرتّب لك العروض حسب اهتمامك.`;
      body.innerHTML = `<div class="grid" style="margin-top:12px">${rest.map(card).join('')}</div>`;
    }
  } catch (e) { console.error(e); body.innerHTML = errorBox(); }
};
})();
