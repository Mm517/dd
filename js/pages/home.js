/* =====================================================================
 * js/pages/home.js
 * الوظيفة: الصفحة الرئيسية: الاشتراك في العروض، بانر الرئيسية المتبدّل، وصفحة home (كروت الأقسام والعروض ومختارة لك).
 * يعتمد على: js/ui/list-parts.js [head] · js/features/ads.js [mountAds] (استدعاء متأخر) · window.KTApp [K, sb, $, $$, esc, purl, curl, imgSrc, ic, loadCats, card, errorBox, noProducts, discount, pages, D, skelQuad]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { K, sb, $, $$, esc, purl, curl, imgSrc, ic, loadCats, card, errorBox, noProducts, discount, pages, Discover: D, skelQuad } = window.KTApp;
const { head } = NS;   // js/ui/list-parts.js
/* مراجع للأمام: بتتنادى وقت الاستخدام فقط (الملف ده بيتحمّل قبل js/features/ads.js) */
const mountAds = (...args) => NS.mountAds(...args);

/* ===================== #newsletter: الاشتراك في العروض (آخر الرئيسية) ===================== */
// #newsletter #subscribe #localstorage
const NEWS_KEY = 'kt_news';
const tickSvg = '<svg class="tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="m14 27 8 8 16-18"/></svg>';
const newsBox = () => {
  let done = false; try { done = localStorage.getItem(NEWS_KEY) === '1'; } catch { /* */ }
  return `<section class="sec news ${done ? 'done' : ''}" id="news" aria-labelledby="news-t"><div class="news__form"><div class="news__txt"><h2 id="news-t">خلّيك أول من يعرف بالعروض</h2><p>اكتب إيميلك ونبعتلك الخصومات والمنتجات الجديدة أول بأول.</p></div>
    <form id="news-f" novalidate><label class="sr" for="news-e">البريد الإلكتروني</label><input class="field" id="news-e" type="email" dir="ltr" autocomplete="email" placeholder="name@example.com" required maxlength="120"><button class="btn btn-sun" id="news-b">اشترك</button></form><p class="news__err" id="news-err" role="alert" hidden></p></div>
    <div class="news__ok" role="status">${tickSvg}<b>تم الاشتراك بنجاح</b><span>هتوصلك أحدث العروض على إيميلك.</span></div></section>`;
};
function bindNews() {
  const box = $('#news'), f = $('#news-f'); if (!box || !f) return;
  const err = $('#news-err'), show = m => { err.textContent = m; err.hidden = false; };
  f.addEventListener('submit', async e => {
    e.preventDefault(); err.hidden = true;
    const email = $('#news-e').value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show('اكتب بريدًا إلكترونيًا صحيحًا');
    const b = $('#news-b'); b.disabled = true;
    const { error } = await sb.from('kt_subscribers').insert({ email });
    b.disabled = false;
    if (error && error.code !== '23505') return show('تعذر الاشتراك الآن، حاول مرة أخرى');   // 23505 = مشترك بالفعل، نعتبرها نجاح
    try { localStorage.setItem(NEWS_KEY, '1'); } catch { /* */ }
    box.classList.add('done');
  });
}

/* الرئيسية على طريقة أمازون: كروت مربعة لكل قسم (4 منتجات حقيقية) + عروض + مقترحات من بحثك ومشاهداتك. المنتجات بتتبدّل كل زيارة. */

/* ===================== #banner: بانر الرئيسية المتبدّل مع الأيام ===================== */
// #banner #slider #config
/* بانر الرئيسية: صور بتتبدّل مع الأيام + كل 6 ثواني (fade). تعديلها من js/core/config.js → banners */
function bannerHtml() {
  const list = K.banners || [];
  if (!list.length) return '';
  const day = Math.floor(Date.now() / 864e5) % list.length, ord = [...list.slice(day), ...list.slice(0, day)];
  return `<div class="banner" id="banner" role="region" aria-roledescription="carousel" aria-label="عروض Kitchenly"><div class="banner__track">${ord.map((b, i) => `<a class="banner__slide imgph${i ? '' : ' on'}" href="${esc(b.href || '/')}" aria-label="${esc(b.alt || '')}" ${i ? 'tabindex="-1" aria-hidden="true"' : ''}><img src="${esc(b.image)}" alt="${esc(b.alt || '')}" width="1600" height="600" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></a>`).join('')}</div>${ord.length > 1 ? `<div class="banner__dots">${ord.map((_, i) => `<button type="button" class="${i ? '' : 'on'}" aria-label="البانر ${i + 1}"></button>`).join('')}</div>` : ''}</div>`;
}
function bindBanner() {
  const root = $('#banner'); if (!root) return;
  const slides = $$('.banner__slide', root), dots = $$('.banner__dots button', root); if (slides.length < 2) return;
  let i = 0, t = null;
  const go = n => { i = (n + slides.length) % slides.length; slides.forEach((x, k) => { x.classList.toggle('on', k === i); x.tabIndex = k === i ? 0 : -1; x.setAttribute('aria-hidden', k === i ? 'false' : 'true'); }); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
  const run = () => { clearInterval(t); t = setInterval(() => { if (!document.hidden) go(i + 1); }, 6000); };
  dots.forEach((d, k) => d.onclick = () => { go(k); run(); });
  root.addEventListener('pointerenter', () => clearInterval(t)); root.addEventListener('pointerleave', run); root.addEventListener('focusin', () => clearInterval(t)); root.addEventListener('focusout', run);
  run();
}

/* ===================== #home: الصفحة الرئيسية ===================== */
// #home #page #categories #offers #discover
/* الرئيسية على طريقة أمازون: كروت مربعة لكل قسم (4 منتجات حقيقية) + عروض + مقترحات من بحثك ومشاهداتك. المنتجات بتتبدّل مع كل ريفرش (ترتيب الكروت والمنتجات داخلها عشوائي). */
// #page-home #route #home #page
pages.home = async () => {
  $('#app').innerHTML = `<div class="wrap">
    ${bannerHtml()}
    <section class="sec sec--cats" id="cats-sec"><div class="sec__head"><h2>أقسام المتجر</h2></div><div class="cats" id="cats">${Array.from({ length: 8 }, () => '<div class="skel" style="height:84px"></div>').join('')}</div></section>
    <div class="qgrid" id="q1">${skelQuad(4)}</div>
    <section class="sec" id="deals-sec" hidden>${head('عروض اليوم', 'خصومات حقيقية على منتجات المتجر، وتتبدّل كل زيارة', '/offers/')}<div class="grid grid--deals" id="deals"></div></section>
    <div class="qgrid" id="q2" hidden></div>
    <div id="because"></div>
    <section class="sec" id="best-sec" hidden>${head('الأكثر طلبًا', 'منتجات يختارها عملاؤنا أكثر', '/shop.html?sort=popular')}<div class="grid" id="best"></div></section>
    <section class="sec" id="recent-sec" hidden>${head('شاهدتها مؤخرًا')}<div class="grid" id="recent"></div></section>
    <section class="sec" id="feed-sec" hidden>${head('اكتشف المزيد', 'مختارة عشوائيًا، وبتتغيّر كل ما تفتح الصفحة')}<div class="grid" id="feed"></div><div class="feed__more"><button class="btn btn-ghost" id="feed-more" type="button">عرض المزيد</button></div></section>
    ${newsBox()}</div>`;
  bindBanner(); bindNews();
  mountAds('home', $('#deals-sec'), { title: 'مختارات مموّلة' });

  let cats = [], prof = null;
  try { [cats, prof] = await Promise.all([loadCats(), D.profile()]); } catch (e) { console.error(e); }
  const tile = (href, icon, name, cls = '') => `<a href="${href}" class="cat ${cls}"><span class="cat__ic">${ic(icon)}</span><span>${esc(name)}</span></a>`;
  $('#cats').innerHTML = cats.length ? cats.map(c => tile(curl(c.slug), c.slug, c.name)).join('') + tile('/offers/', 'offers', 'العروض', 'cat--offers') + tile('/yours-offer', 'yours', 'عروضك', 'cat--offers') : errorBox();
  if (!prof || !prof.all.length) { $('#q1').innerHTML = noProducts('تعذر تحميل المنتجات الآن.'); return; }

  const all = prof.all, inStock = all.filter(p => p.stock > 0), sale = inStock.filter(p => p.old_price > p.price);
  const pick = (list, n) => D.shuffle(list).slice(0, n);
  const qtile = p => `<a class="qtile" href="${purl(p)}"><span class="qtile__img imgph"><img src="${esc(imgSrc(p))}" alt="" loading="lazy" decoding="async">${discount(p) ? `<i class="qtile__off">-${discount(p)}%</i>` : ''}</span><span class="qtile__cap">${esc(p.name)}</span></a>`;
  const quad = (title, sub, list, href, label, cls = '') => list.length ? `<section class="qcard ${cls}"><h2>${title}</h2>${sub ? `<p class="qcard__sub">${sub}</p>` : ''}<div class="qcard__grid n${Math.min(list.length, 4)}">${list.slice(0, 4).map(qtile).join('')}</div><a class="qcard__more" href="${href}">${label}</a></section>` : '';

  /* كروت الصف الأول: عروض + مختارة لك + أقسام (بترتيب عشوائي كل مرة) */
  const topDisc = [...sale].sort((x, y) => discount(y) - discount(x)).slice(0, 8), maxOff = topDisc.length ? discount(topDisc[0]) : 0;
  const dealsCard = quad('عروض اليوم', maxOff ? `خصم يصل إلى ${maxOff}%` : '', pick(topDisc, 4), '/offers/', 'شاهد كل العروض', 'qcard--deal');
  const mine = prof.known ? D.rank(inStock, prof).slice(0, 4) : pick([...inStock].sort((x, y) => y.reviews_count - x.reviews_count).slice(0, 8), 4);
  const mineCard = quad(prof.known ? 'مختارة لك' : 'الأكثر طلبًا', prof.known ? 'حسب اللي بتدور عليه وبتتصفحه' : 'منتجات يحبها عملاؤنا', mine, prof.known ? '/yours-offer' : '/shop.html?sort=popular', prof.known ? 'كل المقترحات' : 'تصفح المزيد', 'qcard--mine');
  const catCards = D.shuffle(cats).map(c => quad(esc(c.name), '', pick(all.filter(p => p.category?.slug === c.slug), 4), curl(c.slug), 'تسوّق القسم')).filter(Boolean);
  $('#q1').innerHTML = [dealsCard, mineCard, ...catCards.slice(0, 2)].filter(Boolean).join('');
  const rest = catCards.slice(2); if (rest.length) { $('#q2').hidden = false; $('#q2').innerHTML = rest.join(''); }

  /* شبكة العروض: كروت منتجات عليها خصم حقيقي */
  if (sale.length) { $('#deals-sec').hidden = false; $('#deals').innerHTML = pick([...sale].sort((x, y) => discount(y) - discount(x)).slice(0, 12), 8).map(card).join(''); }

  /* لأنك بحثت عن ... : منتجات حقيقية مطابقة لبحثك */
  $('#because').innerHTML = prof.queries.slice(0, 2).map(({ q, items }) => `<section class="sec">${head(`لأنك بحثت عن «${esc(q)}»`, 'منتجات من المتجر مطابقة لبحثك', `/shop.html?q=${encodeURIComponent(q)}`, 'كل النتائج')}<div class="grid">${pick(items, 4).map(card).join('')}</div></section>`).join('');

  const bestList = pick([...inStock].sort((x, y) => y.reviews_count - x.reviews_count).slice(0, 12), 8);
  if (bestList.length) { $('#best-sec').hidden = false; $('#best').innerHTML = bestList.map(card).join(''); }
  const recentSlugs = (() => { try { return JSON.parse(localStorage.getItem('kt_recent') || '[]').slice(0, 8); } catch { return []; } })();
  const recentList = recentSlugs.map(sl => prof.by[sl]).filter(Boolean);
  if (recentList.length) { $('#recent-sec').hidden = false; $('#recent').innerHTML = recentList.map(card).join(''); }

  /* اكتشف المزيد: كل المنتجات بترتيب عشوائي جديد مع كل ريفرش، وزر "عرض المزيد" */
  const feed = D.shuffle(inStock.length ? inStock : all), STEP = 8; let shown = 0;
  const more = () => { const chunk = feed.slice(shown, shown + STEP); $('#feed').insertAdjacentHTML('beforeend', chunk.map(card).join('')); shown += chunk.length; $('#feed-more').parentElement.hidden = shown >= feed.length; };
  $('#feed-sec').hidden = false; more(); $('#feed-more').onclick = more;
};
})();
