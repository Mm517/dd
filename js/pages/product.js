/* =====================================================================
 * js/pages/product.js
 * الوظيفة: صفحة المنتج: المعرض والسعر والإضافة للسلة والمنتجات المشابهة والتقييمات.
 * يعتمد على: js/ui/list-parts.js [head] · window.KTApp [sb, $, $$, esc, money, curl, imgSrc, imgList, params, ic, stars, toast, Cart, db, card, emptyBox, discount, pages, setHashtag]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { sb, $, $$, esc, money, curl, imgSrc, imgList, params, ic, stars, toast, Cart, db, card, emptyBox, discount, pages, setHashtag } = window.KTApp;
const { head } = NS;   // js/ui/list-parts.js

/* ===================== #product: صفحة تفاصيل المنتج ===================== */
// #product #gallery #add-to-cart #reviews
// #page-product #route #product #page
pages.product = async () => {
  const slug = (location.pathname.match(/^\/product\/([a-z0-9-]+)\/?$/) || [])[1] || (location.pathname.match(/product-([a-z0-9-]+?)(?:\.html)?\/?$/) || [])[1] || params.get('slug');
  const app = $('#app'); app.innerHTML = `<div class="wrap page"><div class="skel" style="height:420px"></div></div>`;
  const p = slug ? await db.product(slug) : null;
  if (!p) { document.title = 'المنتج غير موجود | Kitchenly'; app.innerHTML = `<div class="wrap page">${emptyBox('لم نجد هذا المنتج. ربما تم إيقافه أو تغير رابطه.', '/shop.html', 'تصفح المنتجات', 'notfound')}</div>`; return; }
  document.title = `${p.name} | Kitchenly`; window.KTApp.recent(p.slug);
  if (p.category) setHashtag(`#${p.category.name.trim().replace(/\s+/g, '_')}`);
  const d = discount(p), out = p.stock < 1, feats = Array.isArray(p.features) ? p.features : [];
  app.innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span><a href="/shop.html">المنتجات</a>${p.category ? `<span>/</span><a href="${curl(p.category.slug)}">${esc(p.category.name)}</a>` : ''}<span>/</span><span>${esc(p.name)}</span></nav>
  <div class="pgrid"><div class="pgal"><div class="pimg"><img id="pmain" src="${esc(imgSrc(p))}" alt="${esc(p.name)}">${d ? `<span class="pcard__off">خصم ${d}%</span>` : ''}</div><div class="pthumbs" id="pthumbs" hidden></div></div>
  <div class="pinfo"><h1>${esc(p.name)}</h1><p class="soldby" id="soldby" hidden></p><a href="#reviews" class="stars stars--link" id="prod-rating" style="margin-top:8px">${p.reviews_count > 0 ? `${stars(p.rating)}<span>${p.rating} (${p.reviews_count} تقييم)</span>` : '<span class="newtag">لا تقييمات بعد، كن أول من يقيّم</span>'}</a>
    <div class="price" style="margin-top:14px"><b>${money(p.price)}</b>${d ? `<s>${money(p.old_price)}</s>` : ''}</div>
    <p class="pinfo__desc">${esc(p.description)}</p>
    ${feats.length ? `<ul class="ticks">${feats.map(f => `<li>${ic('check')}${esc(f)}</li>`).join('')}</ul>` : ''}
    <p style="margin-top:14px" class="${out ? 'stock-out' : p.stock <= 10 ? 'stock-low' : 'stock-ok'}">${out ? 'غير متوفر حاليًا' : p.stock <= 10 ? `متبقي ${p.stock} قطع فقط` : 'متوفر في المخزون'}</p>
    <div class="buyrow"><div class="qty" role="group" aria-label="الكمية"><button id="qm" aria-label="تقليل الكمية">${ic('minus', 'ico-sm')}</button><output id="qv">1</output><button id="qp" aria-label="زيادة الكمية">${ic('plus', 'ico-sm')}</button></div>
      <button id="add" class="btn btn-primary" ${out ? 'disabled' : ''}>أضف إلى السلة</button><button id="buy" class="btn btn-sun" ${out ? 'disabled' : ''}>اشتر الآن</button></div>
    <div class="assure">${[['truck', 'شحن لجميع المحافظات'], ['card', 'دفع أونلاين أو إنستا باي'], ['ret', 'استبدال خلال 14 يومًا']].map(([i, t]) => `<div>${ic(i)}${t}</div>`).join('')}</div></div></div>
  <section class="sec reviews" id="reviews"></section>
  <section class="sec" id="related-wrap" hidden>${head('منتجات مشابهة')}<div class="grid" id="related"></div></section></div>`;
  /* معرض الصور: الصور المتاحة فقط، وبتتبدّل بالمرور أو الضغط على المصغّرة */
  (async () => {
    const all = imgList(p); if (all.length < 2) return;
    const ok = (await Promise.all(all.map((s, i) => i === 0 ? s : new Promise(r => { const im = new Image(); im.onload = () => r(s); im.onerror = () => r(null); im.src = s; })))).filter(Boolean);
    if (ok.length < 2) return;
    const box = $('#pthumbs'), main = $('#pmain'); if (!box || !main) return;
    box.innerHTML = ok.map((s, i) => `<button type="button" class="pthumb ${i ? '' : 'on'}" data-i="${i}" aria-label="صورة ${i + 1}"><img src="${esc(s)}" alt=""></button>`).join(''); box.hidden = false;
    const pick = i => { main.src = ok[i]; $$('.pthumb', box).forEach((b, k) => b.classList.toggle('on', k === i)); };
    box.addEventListener('click', e => { const b = e.target.closest('.pthumb'); if (b) pick(+b.dataset.i); });
    box.addEventListener('pointerover', e => { const b = e.target.closest('.pthumb'); if (b && e.pointerType !== 'touch') pick(+b.dataset.i); });
  })();
  /* البائع + تتبع المشاهدة (مرة لكل جلسة) */
  if (p.store_id) db.storeById(p.store_id).then(st => { const el = $('#soldby'); if (st && el) { el.innerHTML = `${ic('box', 'ico-sm')} يباع بواسطة <a href="/store/${esc(st.slug)}">${esc(st.name)}</a>`; el.hidden = false; } }).catch(() => {});
  try { const k = `kt_pv_${p.slug}`; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); sb.rpc('kt_track_view', { p_slug: p.slug }).then(() => {}, () => {}); } } catch { /* */ }
  if (window.KTApp.mountReviews) window.KTApp.mountReviews(p, $('#reviews'));
  let q = 1; const max = Math.min(p.stock, 20), set = v => { q = Math.max(1, Math.min(v, max || 1)); $('#qv').textContent = q; };
  $('#qm').onclick = () => set(q - 1); $('#qp').onclick = () => set(q + 1);
  $('#add').onclick = () => { Cart.add(p, q); toast('تمت إضافة المنتج إلى السلة'); };
  $('#buy').onclick = () => { Cart.add(p, q); location.href = '/checkout.html'; };
  try { const rel = await db.products({ cat: p.category?.slug, exclude: p.slug, limit: 4, sort: 'popular' }); if (rel.length) { $('#related').innerHTML = rel.map(card).join(''); $('#related-wrap').hidden = false; } } catch { /* اختياري */ }
};
})();
