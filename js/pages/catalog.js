/* =====================================================================
 * js/pages/catalog.js
 * الوظيفة: صفحات القوائم: الأقسام /category والعروض /offers والمنتجات + نتائج البحث (نصي وبالصورة) /shop.
 * يعتمد على: js/ui/list-parts.js [sortList, listShell, chipsRow] · js/features/ads.js [mountAds] (استدعاء متأخر) · window.KTApp [$, esc, params, ic, db, loadCats, loadAll, searchLocal, aiText, card, skeletons, noProducts, emptyBox, pages, setHashtag, D]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $, esc, params, ic, db, loadCats, loadAll, searchLocal, aiText, card, skeletons, noProducts, emptyBox, pages, setHashtag, Discover: D } = window.KTApp;
const { sortList, listShell, chipsRow } = NS;   // js/ui/list-parts.js
/* مراجع للأمام: بتتنادى وقت الاستخدام فقط (الملف ده بيتحمّل قبل js/features/ads.js) */
const mountAds = (...args) => NS.mountAds(...args);

/* ===================== #category: صفحة القسم والعروض ===================== */
// #category #offers #list-page
// #page-category #route #catalog #category
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

// #page-offers #route #catalog #category
pages.offers = async () => {
  listShell({ title: 'العروض والخصومات', sub: 'منتجات عليها خصم حقيقي، والكمية محدودة', icon: 'offers', crumbs: '<span>العروض</span>' });
  const cats = await loadCats(); $('#chips').innerHTML = chipsRow(cats, 'offers');
  let list = [], s = 'discount'; $('#sort').value = s;
  const draw = () => { $('#count').textContent = `${list.length} منتج عليه خصم`; $('#grid').innerHTML = list.length ? sortList(list, s).map(card).join('') : noProducts('لا توجد عروض حاليًا، تابعنا قريبًا.', false); };
  try { list = await db.products({ sale: true }); draw(); } catch (e) { console.error(e); $('#grid').innerHTML = noProducts('تعذر تحميل المنتجات الآن.'); }
  $('#sort').onchange = e => { s = e.target.value; draw(); };
};

/* ===================== #shop: المنتجات ونتائج البحث (نصي وبالصورة) ===================== */
// #shop #search #image-search #ai-search
const aiBox = (msg, thumb) => `<div class="ai-box">${thumb ? `<img class="ai-thumb" src="${thumb}" alt="الصورة التي رفعتها">` : ic('sparkle')}<div><h3>اقتراح ذكي</h3><p>${esc(msg)}</p></div></div>`;

// #page-shop #route #catalog #category
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
})();
