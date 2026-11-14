/* =====================================================================
 * js/ui/header.js
 * الوظيفة: هاشتاج الصفحة، رسم الهيدر وشريط الأقسام (مع زر "المزيد").
 * يعتمد على: js/core/utils.js [K, $, $$, esc, fmt, curl, params] · js/ui/icons.js [ic] · js/core/data.js [loadCats] · js/ui/search-box.js [initSearch] · js/ui/footer.js [renderTabbar] (استدعاء متأخر) · NS.session (قراءة حيّة)
 * يعرض على window.KTApp: TAGS, setHashtag, renderHeader
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K, $, $$, esc, fmt, curl, params } = NS;   // js/core/utils.js
const { ic } = NS;   // js/ui/icons.js
const { loadCats } = NS;   // js/core/data.js
const { initSearch } = NS;   // js/ui/search-box.js
/* مراجع للأمام: بتتنادى وقت الاستخدام فقط (الملف ده بيتحمّل قبل js/ui/footer.js) */
const renderTabbar = (...args) => NS.renderTabbar(...args);

/* ===================== #page-tag: هاشتاج الصفحة (نص عربي ظاهر للمستخدم، غير وسوم البحث في الكود) ===================== */
// #page-tag #hashtag #header

const TAGS = {
  home: '#متجر_أدوات_المطبخ_والتنظيف', shop: '#كل_منتجات_المطبخ', category: '#تسوق_حسب_القسم', offers: '#عروض_وخصومات_المطبخ',
  product: '#تفاصيل_المنتج', cart: '#سلة_التسوق', checkout: '#إتمام_الطلب_والدفع', success: '#تم_استلام_طلبك', track: '#تتبع_طلبك',
  auth: '#تسجيل_الدخول_والحساب', account: '#حسابي_وطلباتي', profile: '#حسابي', myorders: '#طلباتي', myreviews: '#تقييماتي', help: '#مركز_المساعدة', privacy: '#سياسة_الخصوصية', policy: '#سياسات_المتجر', join: '#انضم_إلينا', yours: '#عروضك_أنت', admin: '#لوحة_تحكم_المتجر', policies: '#سياسات_المتجر', contact: '#تواصل_معنا', about: '#من_نحن', notfound: '#الصفحة_غير_موجودة'
};
function setHashtag(tag) { const el = $('#page-tag'); if (el) el.textContent = tag; }

/* ===================== #header: الهيدر وشريط الأقسام ===================== */
// #header #nav #categories #cart-badge

function renderHeader() {
  const page = document.body.dataset.page;
  $('#site-header').innerHTML = `
  <div class="topstrip">شحن مجاني للطلبات فوق ${fmt(K.freeShipFrom)} جنيه • دفع أونلاين أو إنستا باي</div>
  <header class="hdr"><div class="hdr__bar wrap">
    <a href="/" class="hdr__logo" aria-label="Kitchenly - الرئيسية"><img src="/assets/img/logo-mark.jpg" alt=""><span>KITCHENLY</span></a>
    <div class="hdr__search" id="srch"><form class="sbox" action="/shop.html" role="search" autocomplete="off">
      <input name="q" id="q" type="search" placeholder="ابحث عن منتج، أو صِف ما تحتاجه" aria-label="بحث" value="${esc(params.get('q') || '')}">
      ${K.aiSearch ? `<button type="button" id="imgbtn" aria-label="بحث بالصورة" title="بحث بالصورة">${ic('camera')}</button><input type="file" id="imgfile" accept="image/jpeg,image/png,image/webp" hidden>` : ''}
      <button class="sbox__go" aria-label="بحث">${ic('search')}</button></form><div class="sug" id="sug" hidden></div></div>
    <div class="hdr__act">
      <a href="/track.html" class="hdr__link" aria-label="تتبع طلبك">${ic('box')}<span>تتبع طلبك</span></a>
      <a href="${NS.session ? '/profile' : '/auth.html'}" class="hdr__link" aria-label="${NS.session ? 'حسابي' : 'تسجيل الدخول'}">${ic('user')}<span>${NS.session ? 'حسابي' : 'دخول'}</span></a>
      <a href="/cart.html" class="hdr__link" aria-label="السلة">${ic('cart')}<span>السلة</span><b class="badge" data-cart-count hidden>0</b></a></div></div>
    <nav class="catnav" aria-label="الأقسام"><div class="catnav__in wrap"><a href="/offers/" class="deal" ${page === 'offers' ? 'aria-current="true"' : ''}>العروض</a><a href="/yours-offer" class="mine" ${page === 'yours' ? 'aria-current="true"' : ''}>عروضك</a><a href="/shop.html" ${page === 'shop' ? 'aria-current="true"' : ''}>كل المنتجات</a><span id="catnav-list" style="display:contents"></span><button type="button" class="catnav__more" id="catmore" aria-expanded="false" aria-controls="catpanel">المزيد ${ic('chevD', 'ico-sm')}</button></div>
    <div class="catpanel" id="catpanel" hidden><div class="wrap"><p class="catpanel__t">تسوّق حسب القسم</p><div class="catpanel__grid" id="catpanel-grid"></div></div></div></nav>
  </header>
  <div class="hashtag-bar"><div class="wrap"><span>في هذه الصفحة:</span><span class="hashtag" id="page-tag">${esc(TAGS[page] || '')}</span></div></div>`;
  const cur = location.pathname.match(/^\/category\/([^/]+)/)?.[1];
  loadCats().then(list => {
    const el = $('#catnav-list'); if (!el) return;
    el.innerHTML = list.map(x => `<a href="${curl(x.slug)}" class="cn" ${cur === x.slug ? 'aria-current="true"' : ''}>${esc(x.name)}</a>`).join('');
    const tiles = [['/offers/', 'offers', 'العروض', 'on-offer'], ['/yours-offer', 'yours', 'عروضك', 'on-offer'], ...list.map(c => [curl(c.slug), c.slug, c.name, ''])];
    $('#catpanel-grid').innerHTML = tiles.map(([h, i, n, k]) => `<a href="${h}" class="catpanel__tile ${k}"><span class="cat__ic">${ic(i)}</span><span>${esc(n)}</span></a>`).join('');
    fitNav();
  });
  initNavMore();
  initSearch();
  renderTabbar(page);
}

/* شريط الأقسام بدون سكرول: اللي يتسع يظهر، وكل الأقسام في زر "المزيد" */
function fitNav() {
  const inner = $('.catnav__in'); if (!inner) return;
  const links = $$('#catnav-list .cn'); links.forEach(a => { a.hidden = false; });
  let i = links.length; while (i > 0 && inner.scrollWidth > inner.clientWidth + 1) links[--i].hidden = true;
}
function initNavMore() {
  const btn = $('#catmore'), panel = $('#catpanel'); if (!btn || !panel) return;
  const set = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(panel.hidden); });
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('#catpanel')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  let t = null; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitNav, 120); });
  if (document.fonts?.ready) document.fonts.ready.then(fitNav);
}

Object.assign(NS, { TAGS, setHashtag, renderHeader });
})();
