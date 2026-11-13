/* Kitchenly - صفحات المتجر: الرئيسية، المنتجات، الأقسام، العروض، المنتج، السلة، الدفع، التتبع. */
(() => {
'use strict';
const { K, sb, $, $$, esc, fmt, money, purl, curl, imgSrc, imgList, params, ic, stars, toast, Cart, shipping, db, loadCats, loadAll, searchLocal, aiText, card, skeletons, errorBox, noProducts, emptyBox, discount, STATUS, PAYNAME, pages, setHashtag, Discover: D, payLogos, skelQuad } = window.KTApp;

const head = (title, sub, href, label = 'عرض الكل') => `<div class="sec__head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${href ? `<a href="${href}" class="sec__all">${label} ${ic('chevL', 'ico-sm')}</a>` : ''}</div>`;
const sortBar = cur => `<div class="sort"><label for="sort">ترتيب</label><select id="sort" class="field"><option value="for-you">مختارة لك</option><option value="new">الأحدث</option><option value="popular">الأكثر تقييمًا</option><option value="price-asc">السعر من الأقل</option><option value="price-desc">السعر من الأعلى</option><option value="discount">الأعلى خصمًا</option></select></div>`;
/* طريقة عرض أمازون: شبكة أو قائمة (بتتحفظ على جهاز العميل) */
const viewMode = () => { try { return localStorage.getItem('kt_view') === 'list' ? 'list' : 'grid'; } catch { return 'grid'; } };
const viewBar = () => `<div class="viewsw" role="group" aria-label="طريقة العرض"><button type="button" data-view="grid" aria-pressed="${viewMode() === 'grid'}" aria-label="عرض شبكة" title="شبكة"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg></button><button type="button" data-view="list" aria-pressed="${viewMode() === 'list'}" aria-label="عرض قائمة" title="قائمة"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="4" rx="1.5"/><rect x="3" y="10" width="18" height="4" rx="1.5"/><rect x="3" y="16" width="18" height="4" rx="1.5"/></svg></button></div>`;
const sortList = (list, s) => { const a = [...list]; if (s === 'price-asc') a.sort((x, y) => x.price - y.price); else if (s === 'price-desc') a.sort((x, y) => y.price - x.price); else if (s === 'popular') a.sort((x, y) => y.reviews_count - x.reviews_count); else if (s === 'discount') a.sort((x, y) => discount(y) - discount(x)); return a; };

/* ---------------- الرئيسية ---------------- */
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
/* بانر الرئيسية: صور بتتبدّل مع الأيام + كل 6 ثواني (fade). تعديلها من js/config.js → banners */
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

/* الرئيسية على طريقة أمازون: كروت مربعة لكل قسم (4 منتجات حقيقية) + عروض + مقترحات من بحثك ومشاهداتك. المنتجات بتتبدّل مع كل ريفرش (ترتيب الكروت والمنتجات داخلها عشوائي). */
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

/* ---------------- صفحات القوائم: الأقسام والعروض ---------------- */
function listShell({ title, sub, icon, crumbs, sortable = true }) {
  $('#app').innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span>${crumbs}</nav>
  <div style="display:flex;gap:14px;align-items:center">${icon ? `<span class="cat__ic">${ic(icon)}</span>` : ''}<div><h1>${title}</h1>${sub ? `<p class="page__sub">${sub}</p>` : ''}</div></div>
  <div class="toolbar"><div id="chips" style="display:flex;flex-wrap:wrap;gap:8px"></div>${sortable ? sortBar() : ''}${viewBar()}</div><p id="count" class="count" aria-live="polite"></p><div class="grid${viewMode() === 'list' ? ' grid--list' : ''}" id="grid" style="margin-top:12px">${skeletons(8)}</div></div>`;
  $$('[data-view]').forEach(b => b.onclick = () => {
    const m = b.dataset.view; try { localStorage.setItem('kt_view', m); } catch { /* */ }
    $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('#grid, .grid[data-follow-view]').forEach(g => g.classList.toggle('grid--list', m === 'list'));
  });
}
const chipsRow = (cats, cur) => `<a class="chip" href="/shop.html" aria-current="false">الكل</a><a class="chip" href="/offers/" aria-current="${cur === 'offers'}">العروض</a><a class="chip" href="/yours-offer" aria-current="false">عروضك</a>` + cats.map(c => `<a class="chip" href="${curl(c.slug)}" aria-current="${cur === c.slug}">${esc(c.name)}</a>`).join('');

pages.category = async () => {
  const slug = location.pathname.match(/^\/category\/([^/]+)/)?.[1] || params.get('c') || '';
  const cats = await loadCats(), cur = cats.find(c => c.slug === slug);
  if (!cur) { $('#app').innerHTML = `<div class="wrap page">${emptyBox('هذا القسم غير موجود.', '/shop.html', 'كل المنتجات', 'notfound')}</div>`; return; }
  document.title = `${cur.name} | Kitchenly`; setHashtag(`#${cur.name.trim().replace(/\s+/g, '_')}`);
  listShell({ title: esc(cur.name), sub: 'كل منتجات هذا القسم', icon: cur.slug, crumbs: `<a href="/shop.html">المنتجات</a><span>/</span><span>${esc(cur.name)}</span>` });
  $('#chips').innerHTML = chipsRow(cats, slug);
  D.addCat(slug);
  let list = [], fy = [], s = 'for-you'; $('#sort').value = s;
  const draw = () => { $('#count').textContent = `${list.length} منتج`; $('#grid').innerHTML = list.length ? (s === 'for-you' ? fy : sortList(list, s)).map(card).join('') : noProducts('لا توجد منتجات في هذا القسم حاليًا.', false); };
  mountAds('category', $('#count'), { title: 'مموّل في هذا القسم' });
  try { list = await db.products({ cat: slug }); fy = D.rank(list, await D.profile().catch(() => ({ prodW: new Map(), catW: new Map() })), 2); draw(); } catch (e) { console.error(e); $('#grid').innerHTML = noProducts('تعذر تحميل المنتجات الآن.'); }
  $('#sort').onchange = e => { s = e.target.value; draw(); };
};

pages.offers = async () => {
  listShell({ title: 'العروض والخصومات', sub: 'منتجات عليها خصم حقيقي، والكمية محدودة', icon: 'offers', crumbs: '<span>العروض</span>' });
  const cats = await loadCats(); $('#chips').innerHTML = chipsRow(cats, 'offers');
  let list = [], s = 'discount'; $('#sort').value = s;
  const draw = () => { $('#count').textContent = `${list.length} منتج عليه خصم`; $('#grid').innerHTML = list.length ? sortList(list, s).map(card).join('') : noProducts('لا توجد عروض حاليًا، تابعنا قريبًا.', false); };
  try { list = await db.products({ sale: true }); draw(); } catch (e) { console.error(e); $('#grid').innerHTML = noProducts('تعذر تحميل المنتجات الآن.'); }
  $('#sort').onchange = e => { s = e.target.value; draw(); };
};

/* ---------------- المنتجات + نتائج البحث (نصي وبالصورة) ---------------- */
const aiBox = (msg, thumb) => `<div class="ai-box">${thumb ? `<img class="ai-thumb" src="${thumb}" alt="الصورة التي رفعتها">` : ic('sparkle')}<div><h3>اقتراح ذكي</h3><p>${esc(msg)}</p></div></div>`;

pages.shop = async () => {
  const q = params.get('q') || '', isImg = params.get('img') === '1';
  let sort = params.get('sort') || 'for-you';
  const cats = await loadCats();
  const title = isImg ? 'نتائج البحث بالصورة' : q ? `نتائج البحث عن "${esc(q)}"` : 'كل المنتجات';
  setHashtag(isImg ? '#بحث_بالصورة' : q ? '#نتائج_البحث' : '#كل_منتجات_المطبخ');
  listShell({ title, sub: '', crumbs: '<span>المنتجات</span>', sortable: !q && !isImg });
  $('#chips').innerHTML = chipsRow(cats, '');
  const grid = $('#grid'), count = $('#count');
  const extra = html => grid.insertAdjacentHTML('afterend', html);
  const sec = (t, list) => `<h2 class="subhead">${t}</h2><div class="grid">${list.map(card).join('')}</div>`;

  if (isImg) {
    let r = null; try { r = JSON.parse(sessionStorage.getItem('kt_img') || 'null'); } catch { /* */ }
    if (!r) { grid.innerHTML = emptyBox('ارفع صورة من أيقونة الكاميرا في شريط البحث وهنوصلك لأقرب منتج.', '', '', 'imgsearch'); return; }
    const all = await loadAll(), by = Object.fromEntries(all.map(p => [p.slug, p])), ex = r.exact.map(s => by[s]).filter(Boolean), sim = r.similar.map(s => by[s]).filter(Boolean);
    $('.page__sub').textContent = r.label ? `يبدو أن الصورة تحتوي على: ${r.label}` : '';
    grid.outerHTML = aiBox(r.message || 'هذه أقرب نتائج وجدناها.', r.thumb) + (ex.length ? sec('مطابق للصورة', ex) : '') + (sim.length ? sec(ex.length ? 'منتجات مشابهة' : 'أقرب البدائل', sim) : '') + (!ex.length && !sim.length ? emptyBox('لم نجد منتجًا قريبًا من الصورة، جرّب صورة أوضح أو ابحث بالاسم.', '/shop.html', 'تصفح المنتجات', 'search') : '');
    count.textContent = ''; return;
  }

  if (q) {
    grid.innerHTML = skeletons(4);
    const all = await loadAll(), { exact, partial } = searchLocal(q, all);
    if (exact.length || partial.length) D.addSearch(q);
    count.textContent = exact.length ? `${exact.length} نتيجة مطابقة` : '';
    grid.innerHTML = exact.length ? exact.map(card).join('') : '';
    if (!exact.length) grid.remove();
    const holder = document.createElement('div'); (exact.length ? grid : $('.toolbar')).after(holder);
    const shown = new Set(exact.map(p => p.slug));
    if (partial.length && exact.length) holder.insertAdjacentHTML('beforeend', sec('نتائج قريبة', partial.filter(p => !shown.has(p.slug))));
    /* لو مفيش تطابق كامل: اقتراحات ذكية من Gemini، وإلا نعرض الأقرب محليًا */
    if (!exact.length) {
      holder.innerHTML = `<div class="skel" style="height:84px;margin-top:16px"></div>`;
      let ai = null; try { ai = await aiText(q); } catch (e) { console.warn('ai', e.message); }
      const sug = ai ? [...ai.exact, ...ai.similar] : [], seen = new Set(sug.map(p => p.slug)), near = partial.filter(p => !seen.has(p.slug));
      const fallback = (await loadAll()).filter(p => p.featured).slice(0, 4);
      holder.innerHTML = aiBox(ai?.message || `لا يوجد منتج بهذا الاسم بالضبط. إليك أقرب ما لدينا.`) +
        (sug.length ? sec('اقتراحات تناسب بحثك', sug) : '') + (near.length ? sec('نتائج قريبة', near) : '') +
        (!sug.length && !near.length ? `<div class="nores">${window.KTApp.stateImg('search')}<h2>مفيش نتائج لـ «${esc(q)}»</h2><p>جرّب كلمة تانية أو ابحث بالصورة، وده بعض ما قد يعجبك:</p></div>` + sec('قد يعجبك', fallback) : '');
    }
    return;
  }

  let list = [], fy = [];
  const draw = () => { count.textContent = `${list.length} منتج`; grid.innerHTML = list.length ? (sort === 'for-you' ? fy : sortList(list, sort)).map(card).join('') : noProducts('لا توجد منتجات حاليًا.', false); };
  $('#sort').value = sort;
  mountAds('shop', $('#count'), { title: 'مموّل' });
  try { list = await db.products(); fy = D.rank(list, await D.profile().catch(() => ({ prodW: new Map(), catW: new Map() })), 2); draw(); } catch (e) { console.error(e); grid.innerHTML = noProducts('تعذر تحميل المنتجات الآن.'); }
  $('#sort').onchange = e => { sort = e.target.value; draw(); };
};

/* ---------------- صفحة المنتج ---------------- */
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

/* ---------------- السلة ---------------- */
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

/* ---------------- إتمام الطلب والدفع ---------------- */
const GOV = ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'الغربية', 'المنوفية', 'كفر الشيخ', 'البحيرة', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح'];
const ERR = { invalid_name: 'تأكد من كتابة الاسم', invalid_phone: 'رقم الموبايل يجب أن يكون 11 رقمًا ويبدأ بـ 01', invalid_city: 'اختر المحافظة', invalid_address: 'اكتب عنوانًا واضحًا', empty_cart: 'السلة فارغة', product_unavailable: 'أحد المنتجات لم يعد متاحًا، راجع السلة', invalid_payment: 'اختر طريقة دفع صحيحة' };
pages.checkout = async () => {
  const items = Cart.read(), app = $('#app');
  if (!items.length) { app.innerHTML = `<div class="wrap page">${emptyBox('سلتك فارغة، أضف منتجات أولًا.', '/shop.html', 'ابدأ التسوق', 'cart')}</div>`; return; }
  const sub = Cart.subtotal(), sh = shipping(sub), meta = window.KTApp.session?.user?.user_metadata || {};
  const methods = Object.entries(K.payments).filter(([, v]) => v.enabled), first = methods[0]?.[0];
  app.innerHTML = `<div class="wrap page"><h1>إتمام الطلب</h1>
  <form id="co" class="cols" style="margin-top:20px" novalidate>
    <div class="card" style="padding:22px;display:grid;gap:16px"><div class="form-grid two">
      <div><label class="lbl" for="name">الاسم بالكامل</label><input class="field" id="name" name="name" required maxlength="80" autocomplete="name" value="${esc(meta.name || '')}"></div>
      <div><label class="lbl" for="phone">رقم الموبايل</label><input class="field" id="phone" name="phone" required inputmode="numeric" maxlength="11" dir="ltr" placeholder="01xxxxxxxxx" autocomplete="tel"></div>
      <div><label class="lbl" for="city">المحافظة</label><select class="field" id="city" name="city" required><option value="">اختر المحافظة</option>${GOV.map(g => `<option>${g}</option>`).join('')}</select></div>
      <div><label class="lbl" for="address">العنوان بالتفصيل</label><input class="field" id="address" name="address" required maxlength="300" autocomplete="street-address" placeholder="المدينة أو القرية، الشارع، رقم المبنى"></div></div>
      <div><label class="lbl" for="notes">ملاحظات (اختياري)</label><textarea class="field" id="notes" name="notes" rows="2" maxlength="300"></textarea></div>
      <fieldset style="border:0;padding:0;margin:0"><legend class="lbl">طريقة الدفع</legend><div class="pay">${methods.map(([k, v]) => `<label><input type="radio" name="payment" value="${k}" ${k === first ? 'checked' : ''}><span><b>${esc(v.label)}</b><small>${esc(v.hint)}</small></span>${payLogos(k === 'instapay' ? ['instapay'] : ['paymob', 'visa'], 'pay__logos')}</label>`).join('')}</div></fieldset>
      <p id="co-err" class="alert" role="alert" hidden></p></div>
    <aside class="card aside"><h2>طلبك</h2><ul class="mini" style="display:grid;gap:10px">${items.map(i => `<li><img src="${esc(imgSrc(i))}" alt=""><span class="n">${esc(i.name)} <span style="color:var(--muted)">x${i.qty}</span></span><b>${money(i.price * i.qty)}</b></li>`).join('')}</ul>
      <dl class="rows" style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px"><div><dt>المجموع الفرعي</dt><dd>${money(sub)}</dd></div><div><dt>الشحن</dt><dd>${sh ? money(sh) : 'مجاني'}</dd></div><div class="tot"><dt>الإجمالي</dt><dd>${money(sub + sh)}</dd></div></dl>
      <button class="btn btn-primary btn-block" id="co-btn" style="margin-top:16px">تأكيد الطلب</button><a href="/cart.html" class="link-btn" style="display:block;text-align:center;margin-top:10px">العودة إلى السلة</a></aside></form></div>`;
  $('#co').addEventListener('submit', async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.currentTarget)), err = $('#co-err'), btn = $('#co-btn');
    const show = m => { err.textContent = m; err.hidden = false; err.scrollIntoView({ block: 'center' }); };
    err.hidden = true;
    if (!v.name.trim()) return show(ERR.invalid_name); if (!/^01[0-9]{9}$/.test(v.phone.trim())) return show(ERR.invalid_phone); if (!v.city) return show(ERR.invalid_city); if (!v.address.trim()) return show(ERR.invalid_address); if (!v.payment) return show(ERR.invalid_payment);
    btn.disabled = true; btn.textContent = 'جارٍ إرسال الطلب';
    const { data, error } = await sb.rpc('kt_place_order', { p_name: v.name, p_phone: v.phone.trim(), p_city: v.city, p_address: v.address, p_notes: v.notes || null, p_payment: v.payment, p_items: Cart.read().map(i => ({ slug: i.slug, qty: i.qty })) });
    btn.disabled = false; btn.textContent = 'تأكيد الطلب';
    if (error) { const m = (error.message || '').match(/out_of_stock:(.+)/); return show(m ? `الكمية المطلوبة من "${m[1]}" غير متاحة، عدّلها من السلة` : ERR[(error.message || '').trim()] || 'تعذر إرسال الطلب، حاول مرة أخرى'); }
    try { localStorage.setItem('kt_last', JSON.stringify({ no: data.order_no, phone: v.phone.trim() })); } catch { /* التخزين محجوب */ }
    Cart.clear(); location.href = `/order-success.html?no=${encodeURIComponent(data.order_no)}&total=${data.total}&pay=${encodeURIComponent(v.payment)}`;
  });
};

/* صفحة النجاح: هنا تتعلق تعليمات الدفع. اربط البوابة من js/config.js (K.payments). */
pages.success = () => {
  const no = params.get('no'), total = params.get('total'), pay = params.get('pay');
  const P = K.payments || {}; let box = '';
  if (pay === 'instapay') {
    const to = P.instapay?.handle || P.instapay?.phone;
    box = `<div class="paybox"><b>الدفع عبر إنستا باي</b>${payLogos(['instapay'])}<p style="margin-top:6px">${to ? `حوّل ${money(total)} إلى: <b dir="ltr">${esc(to)}</b> واكتب رقم الطلب في الملاحظات.` : 'سنرسل لك بيانات التحويل على رقم الموبايل خلال دقائق.'}</p></div>`;
  } else if (pay === 'online') {
    const u = P.online?.checkoutUrl;
    box = `<div class="paybox"><b>الدفع أونلاين</b>${payLogos(['paymob', 'visa'])}<p style="margin-top:6px">${u ? 'أكمل الدفع بأمان من خلال الزر التالي.' : 'سنرسل لك رابط الدفع الآمن على رقم الموبايل.'}</p>${u ? `<a class="btn btn-primary" style="margin-top:10px" href="${esc(u)}${u.includes('?') ? '&' : '?'}order=${encodeURIComponent(no || '')}&amount=${encodeURIComponent(total || '')}">ادفع الآن</a>` : ''}</div>`;
  }
  $('#app').innerHTML = `<div class="wrap page"><div class="card center wide" style="text-align:center"><img class="hero-ic hero-ic--ok" src="/assets/img/states/order-success.webp" alt="" width="150" height="150"><h1>تم استلام طلبك</h1>
  <p class="page__sub">سنتواصل معك على رقم الموبايل لتأكيد الطلب وموعد التوصيل.</p>
  ${no ? `<p style="margin-top:20px;color:var(--muted);font-size:.9rem">رقم الطلب</p><p style="font-size:1.6rem;font-weight:600;color:var(--green-d)" dir="ltr">${esc(no)}</p>${total ? `<p>الإجمالي ${money(total)}</p>` : ''}` : ''}${box}
  <div class="buyrow" style="justify-content:center;margin-top:24px"><a class="btn btn-primary" href="/track.html${no ? `?no=${encodeURIComponent(no)}` : ''}">تتبع الطلب</a><a class="btn btn-ghost" href="/shop.html">متابعة التسوق</a></div></div></div>`;
};

/* ---------------- تتبع الطلب ---------------- */
const STEPS = ['new', 'confirmed', 'shipping', 'delivered'];
const STEP_IC = { new: 'st-new', confirmed: 'st-ok', shipping: 'st-ship', delivered: 'st-done' };
function orderCard(o) {
  const idx = STEPS.indexOf(o.status), cancelled = o.status === 'cancelled';
  return `<article class="card order"><div class="order__head"><h3 dir="ltr">${esc(o.order_no)}</h3><span class="status ${cancelled ? 'bad' : ''}">${STATUS[o.status]}</span></div>
  ${o.created_at ? `<p class="order__date">${new Date(o.created_at).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
  ${cancelled ? `<div class="order__now order__now--bad">${ic('st-cancel', 'now-ic')}<b>${STATUS.cancelled}</b></div>` : `<div class="order__now">${ic(STEP_IC[o.status] || 'box', 'now-ic')}<b>${STATUS[o.status]}</b></div><ol class="steps">${STEPS.map((s, i) => `<li class="${i <= idx ? 'on' : ''} ${i === idx ? 'cur' : ''}">${ic(STEP_IC[s], 'step-ic')}<i></i>${STATUS[s]}</li>`).join('')}</ol>`}
  <ul class="rows" style="border-top:1px solid var(--line);padding-top:12px">${(o.items || []).map(i => `<li style="display:flex;justify-content:space-between;gap:12px"><span>${esc(i.name)} <span style="color:var(--muted)">x${i.qty}</span></span><span>${money(i.price * i.qty)}</span></li>`).join('')}</ul>
  <dl class="rows"><div><dt>الدفع</dt><dd>${PAYNAME[o.payment_method] || ''}</dd></div><div><dt>الشحن</dt><dd>${+o.shipping ? money(o.shipping) : 'مجاني'}</dd></div><div class="tot"><dt>الإجمالي</dt><dd>${money(o.total)}</dd></div></dl>
  <p style="font-size:.82rem;color:var(--muted)">${esc(o.city)} - ${esc(o.address)}</p></article>`;
}
window.KTApp.orderCard = orderCard;
const lastOrder = () => { try { return JSON.parse(localStorage.getItem('kt_last') || 'null'); } catch { return null; } };
pages.track = async () => {
  const no = (params.get('no') || '').trim().toUpperCase();
  $('#app').innerHTML = `<div class="wrap page"><div style="max-width:680px;margin-inline:auto"><div class="trk__hero"><img src="/assets/img/pages/track-hero.webp" alt="" width="120" height="120"><div><h1>تتبع طلبك</h1><p class="page__sub" id="trk-sub">جارٍ البحث عن طلبك...</p></div></div>
  <div id="trk-pick" class="trk__pick"></div><div id="tr-out" style="margin-top:16px" aria-live="polite"><div class="skel" style="height:160px"></div></div>
  <details class="card trk__manual" id="trk-manual"><summary>تتبّع طلب آخر برقم الطلب ورقم الموبايل</summary>
  <form id="tr" class="form-grid two" style="padding:0 18px 18px"><div><label class="lbl" for="no">رقم الطلب</label><input class="field" id="no" required dir="ltr" placeholder="KT-250101-12345" value="${esc(no)}"></div><div><label class="lbl" for="ph">رقم الموبايل</label><input class="field" id="ph" required inputmode="numeric" maxlength="11" dir="ltr" placeholder="01xxxxxxxxx"></div><button class="btn btn-primary" style="grid-column:1/-1">بحث</button></form></details></div></div>`;
  const out = $('#tr-out'), sub = $('#trk-sub'), pick = $('#trk-pick'), manual = $('#trk-manual');
  let mine = [], target = null;
  /* 1) حساب مسجّل: طلباته تظهر بدون كتابة أي شيء */
  try {
    const ses = await window.KTApp.getSession();
    if (ses) { const { data } = await sb.from('kt_orders').select('*').eq('user_id', ses.user.id).order('created_at', { ascending: false }).limit(20); mine = data || []; }
  } catch { /* نكمل بالطرق الأخرى */ }
  if (mine.length) target = no ? mine.find(o => o.order_no === no) : mine[0];
  /* 2) زائر: آخر طلب تم من نفس الجهاز */
  if (!target) {
    const last = lastOrder();
    if (last && (!no || last.no === no)) { try { const { data } = await sb.rpc('kt_track_order', { p_order_no: last.no, p_phone: last.phone }); if (data) target = data; } catch { /* */ } }
  }
  if (target) {
    sub.textContent = 'حالة طلبك الآن';
    out.innerHTML = orderCard(target);
    if (mine.length > 1) pick.innerHTML = `<span style="color:var(--muted);font-size:.85rem">طلباتك:</span>` + mine.map(o => `<a class="chip" href="/track.html?no=${encodeURIComponent(o.order_no)}" aria-current="${o.order_no === target.order_no}" dir="ltr">${esc(o.order_no)}</a>`).join('');
  } else {
    sub.textContent = no ? (window.KTApp.session ? 'لم نجد هذا الطلب على حسابك. اكتب رقم الموبايل الذي استخدمته عند الشراء.' : 'اكتب رقم الموبايل الذي استخدمته عند الشراء لعرض الطلب.') : mine.length === 0 && window.KTApp.session ? 'لا توجد طلبات على حسابك بعد.' : 'اكتب رقم الطلب ورقم الموبايل الذي استخدمته عند الشراء.';
    out.innerHTML = '<div class="trk__empty"><img src="/assets/img/pages/track-pin.webp" alt="" loading="lazy"></div>'; manual.open = true;
    if (!window.KTApp.session && !no) pick.innerHTML = `<a class="link-btn" href="/auth.html?next=/track.html">سجّل دخولك لتظهر لك طلباتك تلقائيًا</a>`;
  }
  $('#tr').addEventListener('submit', async e => {
    e.preventDefault(); out.innerHTML = '<div class="skel" style="height:120px"></div>';
    const { data, error } = await sb.rpc('kt_track_order', { p_order_no: $('#no').value, p_phone: $('#ph').value.trim() });
    if (error) { out.innerHTML = errorBox(); return; }
    out.innerHTML = data ? orderCard(data) : `<div class="card empty"><p>لم نجد طلبًا بهذه البيانات. تأكد من الرقمين وحاول مرة أخرى.</p></div>`;
  });
  if (manual.open) (no ? $('#ph') : $('#no')).focus();
};

/* ---------------- تواصل / سياسات / 404 ---------------- */
pages.contact = () => {
  $('#app').innerHTML = `<div class="wrap page"><h1>تواصل معنا</h1><p class="page__sub">اسأل عن منتج أو طلب، ونرد عليك في أقرب وقت.</p>
  <div class="cols" style="margin-top:20px"><form id="ct" class="card" style="padding:22px;display:grid;gap:16px"><div class="form-grid two"><div><label class="lbl" for="cn">الاسم</label><input class="field" id="cn" required maxlength="80"></div><div><label class="lbl" for="cp">رقم الموبايل (اختياري)</label><input class="field" id="cp" maxlength="20" dir="ltr" inputmode="tel"></div></div><div><label class="lbl" for="cb">رسالتك</label><textarea class="field" id="cb" rows="5" required maxlength="1000"></textarea></div><button class="btn btn-primary">إرسال الرسالة</button></form>
  <aside class="card aside"><p dir="ltr" style="text-align:start"><a href="tel:${esc(K.phone.replace(/\s/g, ''))}">${esc(K.phone)}</a></p><p style="margin:10px 0">يوميًا من 9 صباحًا إلى 9 مساءً</p><a class="btn btn-sun btn-block" href="https://wa.me/${K.whatsapp}" target="_blank" rel="noopener">راسلنا على واتساب</a></aside></div></div>`;
  $('#ct').addEventListener('submit', async e => {
    e.preventDefault(); const b = $('button', e.currentTarget); b.disabled = true;
    const { error } = await sb.from('kt_messages').insert({ name: $('#cn').value.trim(), phone: $('#cp').value.trim() || null, body: $('#cb').value.trim() });
    b.disabled = false; if (error) return toast('تعذر إرسال الرسالة، حاول مرة أخرى', 'err'); e.currentTarget.reset(); toast('تم إرسال رسالتك، شكرًا لتواصلك');
  });
};
pages.notfound = () => { $('#app').innerHTML = `<div class="wrap page">${emptyBox('الصفحة التي تبحث عنها غير موجودة.', '/', 'العودة للرئيسية', 'notfound')}</div>`; };
/* صفحة السياسات القديمة: نحوّل للصفحات الجديدة */
pages.policies = () => { location.replace(location.hash === '#privacy' ? '/privacy' : `/policy${location.hash}`); };

/* ---------------- الإعلانات المموّلة (kt_active_ads) ---------------- */
const adEvent = (ad, kind) => { try { fetch(`${K.url}/rest/v1/rpc/kt_ad_event`, { method: 'POST', keepalive: true, headers: { apikey: K.key, Authorization: `Bearer ${K.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_ad: ad, p_kind: kind }) }).catch(() => {}); } catch { /* */ } };
const once = k => { try { if (sessionStorage.getItem(k)) return false; sessionStorage.setItem(k, '1'); } catch { /* */ } return true; };
async function mountAds(placement, before, { title = 'منتجات مموّلة', n = 4 } = {}) {
  if (!before || !before.parentNode) return;
  try {
    const { data, error } = await sb.rpc('kt_active_ads', { p_placement: placement }); if (error || !data || !data.length) return;
    const list = data.slice(0, n), prods = await db.bySlugs(list.map(a => a.slug)), by = Object.fromEntries(prods.map(p => [p.slug, p]));
    const rows = list.filter(a => by[a.slug]); if (!rows.length) return;
    const sec = document.createElement('section'); sec.className = 'sec sec--ads';
    sec.innerHTML = head(title, 'إعلانات من متاجر شريكة') + `<div class="grid">${rows.map(a => card(by[a.slug]).replace('<article class="pcard">', `<article class="pcard pcard--ad" data-ad="${esc(a.ad_id)}"><span class="pcard__sp">مُموّل</span>`)).join('')}</div>`;
    before.parentNode.insertBefore(sec, before);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); const id = e.target.dataset.ad; if (once(`kt_ai_${id}`)) adEvent(id, 'impression'); } }), { threshold: .5 }) : null;
    $$('[data-ad]', sec).forEach(el => io ? io.observe(el) : (once(`kt_ai_${el.dataset.ad}`) && adEvent(el.dataset.ad, 'impression')));
    sec.addEventListener('click', e => { const a = e.target.closest('a[href]'), c = e.target.closest('[data-ad]'); if (a && c && once(`kt_ac_${c.dataset.ad}`)) adEvent(c.dataset.ad, 'click'); });
  } catch (e) { console.warn('ads', e.message); }
}

/* ---------------- صفحة المتجر /store/<slug> ---------------- */
pages.store = async () => {
  const slug = (location.pathname.match(/^\/store\/([a-z0-9-]+)\/?$/) || [])[1], app = $('#app');
  app.innerHTML = `<div class="wrap page"><div class="skel" style="height:200px"></div><div class="grid" style="margin-top:20px">${skeletons(4)}</div></div>`;
  const st = slug ? await db.store(slug).catch(() => null) : null;
  if (!st) { document.title = 'المتجر غير موجود | Kitchenly'; app.innerHTML = `<div class="wrap page">${emptyBox('لم نجد هذا المتجر. ربما تم إيقافه أو تغير رابطه.', '/shop.html', 'تصفح المنتجات', 'notfound')}</div>`; return; }
  document.title = `${st.name} | Kitchenly`; setHashtag(`#${st.name.trim().replace(/\s+/g, '_')}`);
  app.innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span><span>${esc(st.name)}</span></nav>
  <header class="storehd${st.cover ? '' : ' storehd--def'}"${st.cover ? ` style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55)),url('${esc(st.cover)}')"` : ` style="background-image:linear-gradient(270deg,rgba(255,255,255,.92),rgba(255,255,255,.6) 55%,rgba(255,255,255,.1)),url('/assets/img/pages/seller-cover.webp')"`}>
    <span class="storehd__lg">${st.logo ? `<img src="${esc(st.logo)}" alt="">` : ic('box', 'ico-lg')}</span>
    <div><h1>${esc(st.name)}</h1><p>${[st.city, 'متجر شريك على Kitchenly'].filter(Boolean).map(esc).join(' • ')}</p>${st.description ? `<p class="storehd__ds">${esc(st.description)}</p>` : ''}</div></header>
  <div class="toolbar"><div style="flex:1"></div>${sortBar().replace('<option value="for-you">مختارة لك</option>', '').replace(/<option value="discount">[^<]*<\/option>/, '')}${viewBar()}</div>
  <p id="count" class="count" aria-live="polite"></p><div class="grid${viewMode() === 'list' ? ' grid--list' : ''}" id="grid" style="margin-top:12px">${skeletons(4)}</div></div>`;
  $$('[data-view]').forEach(b => b.onclick = () => { const m = b.dataset.view; try { localStorage.setItem('kt_view', m); } catch { /* */ } $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#grid').classList.toggle('grid--list', m === 'list'); });
  let list = [], s = 'new'; $('#sort').value = s;
  const draw = () => { $('#count').textContent = `${list.length} منتج`; $('#grid').innerHTML = list.length ? sortList(list, s).map(card).join('') : noProducts('لا توجد منتجات في هذا المتجر حاليًا.', false); };
  try { list = await db.byStore(st.id); draw(); } catch (e) { console.error(e); $('#grid').innerHTML = noProducts('تعذر تحميل المنتجات الآن.'); }
  $('#sort').onchange = e => { s = e.target.value; draw(); };
};

})();
