/* Kitchenly - صفحات المتجر: الرئيسية، المنتجات، الأقسام، العروض، المنتج، السلة، الدفع، التتبع. */
(() => {
'use strict';
const { K, sb, $, $$, esc, fmt, money, purl, curl, imgSrc, params, ic, stars, toast, Cart, shipping, db, loadCats, loadAll, searchLocal, aiText, card, skeletons, errorBox, emptyBox, discount, STATUS, PAYNAME, pages, setHashtag } = window.KTApp;

const head = (title, sub, href, label = 'عرض الكل') => `<div class="sec__head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${href ? `<a href="${href}" class="sec__all">${label} ${ic('chevL', 'ico-sm')}</a>` : ''}</div>`;
const sortBar = cur => `<div class="sort"><label for="sort">ترتيب</label><select id="sort" class="field"><option value="new">الأحدث</option><option value="popular">الأكثر تقييمًا</option><option value="price-asc">السعر من الأقل</option><option value="price-desc">السعر من الأعلى</option><option value="discount">الأعلى خصمًا</option></select></div>`;
const sortList = (list, s) => { const a = [...list]; if (s === 'price-asc') a.sort((x, y) => x.price - y.price); else if (s === 'price-desc') a.sort((x, y) => y.price - x.price); else if (s === 'popular') a.sort((x, y) => y.reviews_count - x.reviews_count); else if (s === 'discount') a.sort((x, y) => discount(y) - discount(x)); return a; };

/* ---------------- الرئيسية ---------------- */
const ship = () => {
  const sub = Cart.subtotal(), left = K.freeShipFrom - sub;
  const msg = sub === 0 ? `<b>شحن مجاني</b> على الطلبات فوق ${fmt(K.freeShipFrom)} جنيه` : left > 0 ? `أضف <b>${money(left)}</b> للحصول على <b>شحن مجاني</b>` : '<b>مبروك! طلبك مؤهل للشحن المجاني</b>';
  return `<div class="ship">${ic('truck', 'ico-lg')}<div class="ship__body">${msg}<div class="ship__bar"><i style="width:${sub === 0 ? 0 : Math.min(100, Math.round(sub / K.freeShipFrom * 100))}%"></i></div></div>${sub > 0 ? '<a href="/cart.html" class="btn btn-primary btn-sm">السلة</a>' : ''}</div>`;
};

pages.home = async () => {
  const b = K.banner, perks = [['shield', 'جودة مضمونة', 'منتجات مفحوصة قبل الشحن'], ['truck', 'توصيل سريع', 'لجميع محافظات مصر'], ['ret', 'استبدال سهل', 'خلال 14 يومًا'], ['card', 'دفع آمن', 'أونلاين أو إنستا باي']];
  $('#app').innerHTML = `<div class="wrap">
    <a class="banner" href="${esc(b.href)}" aria-label="${esc(b.alt)}"><img src="${esc(b.image)}" alt="${esc(b.alt)}" fetchpriority="high"></a>
    <section class="sec" id="cats-sec">${head('أقسام المتجر', 'اختر القسم الذي تحتاجه')}<div class="cats" id="cats">${Array.from({ length: 7 }, () => '<div class="skel" style="height:140px"></div>').join('')}</div></section>
    <div class="perks">${perks.map(([i, t, s]) => `<div class="perk">${ic(i)}<div><b>${t}</b><small>${s}</small></div></div>`).join('')}</div>
    <section class="sec" id="ship-sec">${ship()}</section>
    <section class="sec" id="deals-sec" hidden>${head('عروض اليوم', 'خصومات حقيقية على منتجات مختارة', '/offers/')}<div class="rail" id="deals"></div></section>
    <section class="sec" id="best-sec">${head('الأكثر مبيعًا', 'منتجات يختارها عملاؤنا أكثر', '/shop.html?sort=popular')}<div class="grid" id="best">${skeletons(8)}</div></section>
    <section class="sec" id="recent-sec" hidden>${head('شاهدتها مؤخرًا')}<div class="rail" id="recent"></div></section></div>`;
  const recentSlugs = (() => { try { return JSON.parse(localStorage.getItem('kt_recent') || '[]').slice(0, 10); } catch { return []; } })();
  const [cats, best, sale, rec] = await Promise.allSettled([loadCats(), db.products({ featured: true, limit: 8, sort: 'popular' }), db.products({ sale: true, sort: 'popular' }), recentSlugs.length ? db.bySlugs(recentSlugs) : Promise.resolve([])]);
  const tile = (href, icon, name, sub = '', cls = '') => `<a href="${href}" class="cat ${cls}"><span class="cat__ic">${ic(icon)}</span><span>${esc(name)}</span>${sub ? `<small>${sub}</small>` : ''}</a>`;
  const saleList = sale.status === 'fulfilled' ? sale.value : [];
  $('#cats').innerHTML = cats.status === 'fulfilled' && cats.value.length ? cats.value.map(c => tile(curl(c.slug), c.slug, c.name)).join('') + tile('/offers/', 'offers', 'العروض', saleList.length ? `${saleList.length} منتج مخفّض` : '', 'cat--offers') : errorBox();
  if (saleList.length) { $('#deals-sec').hidden = false; $('#deals').innerHTML = [...saleList].sort((a, c) => discount(c) - discount(a)).map(card).join(''); }
  $('#best').innerHTML = best.status === 'fulfilled' ? (best.value.length ? best.value.map(card).join('') : emptyBox('لا توجد منتجات حاليًا.')) : errorBox();
  if (rec.status === 'fulfilled' && rec.value.length) { const l = [...rec.value].sort((a, c) => recentSlugs.indexOf(a.slug) - recentSlugs.indexOf(c.slug)); $('#recent-sec').hidden = false; $('#recent').innerHTML = l.map(card).join(''); }
};
document.addEventListener('click', e => { if (e.target.closest('[data-add]')) setTimeout(() => { const s = $('#ship-sec'); if (s) s.innerHTML = ship(); }, 0); });

/* ---------------- صفحات القوائم: الأقسام والعروض ---------------- */
function listShell({ title, sub, icon, crumbs, sortable = true }) {
  $('#app').innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span>${crumbs}</nav>
  <div style="display:flex;gap:14px;align-items:center">${icon ? `<span class="cat__ic">${ic(icon)}</span>` : ''}<div><h1>${title}</h1>${sub ? `<p class="page__sub">${sub}</p>` : ''}</div></div>
  <div class="toolbar"><div id="chips" style="display:flex;flex-wrap:wrap;gap:8px"></div>${sortable ? sortBar() : ''}</div><p id="count" class="count" aria-live="polite"></p><div class="grid" id="grid" style="margin-top:12px">${skeletons(8)}</div></div>`;
}
const chipsRow = (cats, cur) => `<a class="chip" href="/shop.html" aria-current="false">الكل</a><a class="chip" href="/offers/" aria-current="${cur === 'offers'}">العروض</a>` + cats.map(c => `<a class="chip" href="${curl(c.slug)}" aria-current="${cur === c.slug}">${esc(c.name)}</a>`).join('');

pages.category = async () => {
  const slug = location.pathname.match(/^\/category\/([^/]+)/)?.[1] || params.get('c') || '';
  const cats = await loadCats(), cur = cats.find(c => c.slug === slug);
  if (!cur) { $('#app').innerHTML = `<div class="wrap page">${emptyBox('هذا القسم غير موجود.', '/shop.html', 'كل المنتجات')}</div>`; return; }
  document.title = `${cur.name} | Kitchenly`; setHashtag(`#${cur.name.trim().replace(/\s+/g, '_')}`);
  listShell({ title: esc(cur.name), sub: 'كل منتجات هذا القسم', icon: cur.slug, crumbs: `<a href="/shop.html">المنتجات</a><span>/</span><span>${esc(cur.name)}</span>` });
  $('#chips').innerHTML = chipsRow(cats, slug);
  let list = [], s = 'new';
  const draw = () => { $('#count').textContent = `${list.length} منتج`; $('#grid').innerHTML = list.length ? sortList(list, s).map(card).join('') : emptyBox('لا توجد منتجات في هذا القسم حاليًا.'); };
  try { list = await db.products({ cat: slug }); draw(); } catch (e) { console.error(e); $('#grid').innerHTML = errorBox(); }
  $('#sort').onchange = e => { s = e.target.value; draw(); };
};

pages.offers = async () => {
  listShell({ title: 'العروض والخصومات', sub: 'منتجات عليها خصم حقيقي، والكمية محدودة', icon: 'offers', crumbs: '<span>العروض</span>' });
  const cats = await loadCats(); $('#chips').innerHTML = chipsRow(cats, 'offers');
  let list = [], s = 'discount'; $('#sort').value = s;
  const draw = () => { $('#count').textContent = `${list.length} منتج عليه خصم`; $('#grid').innerHTML = list.length ? sortList(list, s).map(card).join('') : emptyBox('لا توجد عروض حاليًا، تابعنا قريبًا.'); };
  try { list = await db.products({ sale: true }); draw(); } catch (e) { console.error(e); $('#grid').innerHTML = errorBox(); }
  $('#sort').onchange = e => { s = e.target.value; draw(); };
};

/* ---------------- المنتجات + نتائج البحث (نصي وبالصورة) ---------------- */
const aiBox = (msg, thumb) => `<div class="ai-box">${thumb ? `<img class="ai-thumb" src="${thumb}" alt="الصورة التي رفعتها">` : ic('sparkle')}<div><h3>اقتراح ذكي</h3><p>${esc(msg)}</p></div></div>`;

pages.shop = async () => {
  const q = params.get('q') || '', isImg = params.get('img') === '1';
  let sort = params.get('sort') || 'new';
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
    if (!r) { grid.innerHTML = emptyBox('ارفع صورة من أيقونة الكاميرا في شريط البحث.'); return; }
    const all = await loadAll(), by = Object.fromEntries(all.map(p => [p.slug, p])), ex = r.exact.map(s => by[s]).filter(Boolean), sim = r.similar.map(s => by[s]).filter(Boolean);
    $('.page__sub').textContent = r.label ? `يبدو أن الصورة تحتوي على: ${r.label}` : '';
    grid.outerHTML = aiBox(r.message || 'هذه أقرب نتائج وجدناها.', r.thumb) + (ex.length ? sec('مطابق للصورة', ex) : '') + (sim.length ? sec(ex.length ? 'منتجات مشابهة' : 'أقرب البدائل', sim) : '') + (!ex.length && !sim.length ? emptyBox('لم نجد منتجًا قريبًا من الصورة، جرّب صورة أوضح أو ابحث بالاسم.') : '');
    count.textContent = ''; return;
  }

  if (q) {
    grid.innerHTML = skeletons(4);
    const all = await loadAll(), { exact, partial } = searchLocal(q, all);
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
        (!sug.length && !near.length ? sec('قد يعجبك', fallback) : '');
    }
    return;
  }

  let list = [];
  const draw = () => { count.textContent = `${list.length} منتج`; grid.innerHTML = list.length ? sortList(list, sort).map(card).join('') : emptyBox('لا توجد منتجات حاليًا.'); };
  $('#sort').value = sort;
  try { list = await db.products(); draw(); } catch (e) { console.error(e); grid.innerHTML = errorBox(); }
  $('#sort').onchange = e => { sort = e.target.value; draw(); };
};

/* ---------------- صفحة المنتج ---------------- */
pages.product = async () => {
  const slug = document.body.dataset.slug || params.get('slug') || (location.pathname.match(/product-([a-z0-9-]+?)(?:\.html)?\/?$/) || [])[1];
  const app = $('#app'); app.innerHTML = `<div class="wrap page"><div class="skel" style="height:420px"></div></div>`;
  const p = slug ? await db.product(slug) : null;
  if (!p) { document.title = 'المنتج غير موجود | Kitchenly'; app.innerHTML = `<div class="wrap page">${emptyBox('لم نجد هذا المنتج. ربما تم إيقافه أو تغير رابطه.')}</div>`; return; }
  document.title = `${p.name} | Kitchenly`; window.KTApp.recent(p.slug);
  if (p.category) setHashtag(`#${p.category.name.trim().replace(/\s+/g, '_')}`);
  const d = discount(p), out = p.stock < 1, feats = Array.isArray(p.features) ? p.features : [];
  app.innerHTML = `<div class="wrap page"><nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span>/</span><a href="/shop.html">المنتجات</a>${p.category ? `<span>/</span><a href="${curl(p.category.slug)}">${esc(p.category.name)}</a>` : ''}<span>/</span><span>${esc(p.name)}</span></nav>
  <div class="pgrid"><div class="pimg"><img src="${esc(imgSrc(p))}" alt="${esc(p.name)}">${d ? `<span class="pcard__off">خصم ${d}%</span>` : ''}</div>
  <div class="pinfo"><h1>${esc(p.name)}</h1><div class="stars" style="margin-top:8px">${stars(p.rating)}<span>${p.rating} (${p.reviews_count} تقييم)</span></div>
    <div class="price" style="margin-top:14px"><b>${money(p.price)}</b>${d ? `<s>${money(p.old_price)}</s>` : ''}</div>
    <p class="pinfo__desc">${esc(p.description)}</p>
    ${feats.length ? `<ul class="ticks">${feats.map(f => `<li>${ic('check')}${esc(f)}</li>`).join('')}</ul>` : ''}
    <p style="margin-top:14px" class="${out ? 'stock-out' : p.stock <= 10 ? 'stock-low' : 'stock-ok'}">${out ? 'غير متوفر حاليًا' : p.stock <= 10 ? `متبقي ${p.stock} قطع فقط` : 'متوفر في المخزون'}</p>
    <div class="buyrow"><div class="qty" role="group" aria-label="الكمية"><button id="qm" aria-label="تقليل الكمية">${ic('minus', 'ico-sm')}</button><output id="qv">1</output><button id="qp" aria-label="زيادة الكمية">${ic('plus', 'ico-sm')}</button></div>
      <button id="add" class="btn btn-primary" ${out ? 'disabled' : ''}>أضف إلى السلة</button><button id="buy" class="btn btn-sun" ${out ? 'disabled' : ''}>اشتر الآن</button></div>
    <div class="assure">${[['truck', 'شحن لجميع المحافظات'], ['card', 'دفع أونلاين أو إنستا باي'], ['ret', 'استبدال خلال 14 يومًا']].map(([i, t]) => `<div>${ic(i)}${t}</div>`).join('')}</div></div></div>
  <section class="sec" id="related-wrap" hidden>${head('منتجات مشابهة')}<div class="grid" id="related"></div></section></div>`;
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
    if (!items.length) { app.innerHTML = `<div class="wrap page">${emptyBox('سلتك فارغة حاليًا.')}</div>`; return; }
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
  if (!items.length) { app.innerHTML = `<div class="wrap page">${emptyBox('سلتك فارغة، أضف منتجات أولًا.')}</div>`; return; }
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
      <fieldset style="border:0;padding:0;margin:0"><legend class="lbl">طريقة الدفع</legend><div class="pay">${methods.map(([k, v]) => `<label><input type="radio" name="payment" value="${k}" ${k === first ? 'checked' : ''}><span><b>${esc(v.label)}</b><small>${esc(v.hint)}</small></span></label>`).join('')}</div></fieldset>
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
    Cart.clear(); location.href = `/order-success.html?no=${encodeURIComponent(data.order_no)}&total=${data.total}&pay=${encodeURIComponent(v.payment)}`;
  });
};

/* صفحة النجاح: هنا تتعلق تعليمات الدفع. اربط البوابة من js/config.js (K.payments). */
pages.success = () => {
  const no = params.get('no'), total = params.get('total'), pay = params.get('pay');
  const P = K.payments || {}; let box = '';
  if (pay === 'instapay') {
    const to = P.instapay?.handle || P.instapay?.phone;
    box = `<div class="paybox"><b>الدفع عبر إنستا باي</b><p style="margin-top:6px">${to ? `حوّل ${money(total)} إلى: <b dir="ltr">${esc(to)}</b> واكتب رقم الطلب في الملاحظات.` : 'سنرسل لك بيانات التحويل على رقم الموبايل خلال دقائق.'}</p></div>`;
  } else if (pay === 'online') {
    const u = P.online?.checkoutUrl;
    box = `<div class="paybox"><b>الدفع أونلاين</b><p style="margin-top:6px">${u ? 'أكمل الدفع بأمان من خلال الزر التالي.' : 'سنرسل لك رابط الدفع الآمن على رقم الموبايل.'}</p>${u ? `<a class="btn btn-primary" style="margin-top:10px" href="${esc(u)}${u.includes('?') ? '&' : '?'}order=${encodeURIComponent(no || '')}&amount=${encodeURIComponent(total || '')}">ادفع الآن</a>` : ''}</div>`;
  }
  $('#app').innerHTML = `<div class="wrap page"><div class="card center wide" style="text-align:center"><span class="okmark">${ic('check', 'ico-lg')}</span><h1>تم استلام طلبك</h1>
  <p class="page__sub">سنتواصل معك على رقم الموبايل لتأكيد الطلب وموعد التوصيل.</p>
  ${no ? `<p style="margin-top:20px;color:var(--muted);font-size:.9rem">رقم الطلب</p><p style="font-size:1.6rem;font-weight:600;color:var(--green-d)" dir="ltr">${esc(no)}</p>${total ? `<p>الإجمالي ${money(total)}</p>` : ''}` : ''}${box}
  <div class="buyrow" style="justify-content:center;margin-top:24px"><a class="btn btn-primary" href="/track.html${no ? `?no=${encodeURIComponent(no)}` : ''}">تتبع الطلب</a><a class="btn btn-ghost" href="/shop.html">متابعة التسوق</a></div></div></div>`;
};

/* ---------------- تتبع الطلب ---------------- */
const STEPS = ['new', 'confirmed', 'shipping', 'delivered'];
function orderCard(o) {
  const idx = STEPS.indexOf(o.status), cancelled = o.status === 'cancelled';
  return `<article class="card order"><div class="order__head"><h3 dir="ltr">${esc(o.order_no)}</h3><span class="status ${cancelled ? 'bad' : ''}">${STATUS[o.status]}</span></div>
  ${cancelled ? '' : `<ol class="steps">${STEPS.map((s, i) => `<li class="${i <= idx ? 'on' : ''}"><i></i>${STATUS[s]}</li>`).join('')}</ol>`}
  <ul class="rows" style="border-top:1px solid var(--line);padding-top:12px">${(o.items || []).map(i => `<li style="display:flex;justify-content:space-between;gap:12px"><span>${esc(i.name)} <span style="color:var(--muted)">x${i.qty}</span></span><span>${money(i.price * i.qty)}</span></li>`).join('')}</ul>
  <dl class="rows"><div><dt>الدفع</dt><dd>${PAYNAME[o.payment_method] || ''}</dd></div><div><dt>الشحن</dt><dd>${+o.shipping ? money(o.shipping) : 'مجاني'}</dd></div><div class="tot"><dt>الإجمالي</dt><dd>${money(o.total)}</dd></div></dl>
  <p style="font-size:.82rem;color:var(--muted)">${esc(o.city)} - ${esc(o.address)}</p></article>`;
}
window.KTApp.orderCard = orderCard;
pages.track = () => {
  $('#app').innerHTML = `<div class="wrap page"><div style="max-width:680px;margin-inline:auto"><h1>تتبع طلبك</h1><p class="page__sub">اكتب رقم الطلب ورقم الموبايل الذي استخدمته عند الشراء.</p>
  <form id="tr" class="card form-grid two" style="margin-top:20px;padding:20px"><div><label class="lbl" for="no">رقم الطلب</label><input class="field" id="no" required dir="ltr" placeholder="KT-250101-12345" value="${esc(params.get('no') || '')}"></div><div><label class="lbl" for="ph">رقم الموبايل</label><input class="field" id="ph" required inputmode="numeric" maxlength="11" dir="ltr" placeholder="01xxxxxxxxx"></div><button class="btn btn-primary" style="grid-column:1/-1">بحث</button></form>
  <div id="tr-out" style="margin-top:20px" aria-live="polite"></div></div></div>`;
  $('#tr').addEventListener('submit', async e => {
    e.preventDefault(); const out = $('#tr-out'); out.innerHTML = '<div class="skel" style="height:120px"></div>';
    const { data, error } = await sb.rpc('kt_track_order', { p_order_no: $('#no').value, p_phone: $('#ph').value.trim() });
    if (error) { out.innerHTML = errorBox(); return; }
    out.innerHTML = data ? orderCard(data) : `<div class="card empty"><p>لم نجد طلبًا بهذه البيانات. تأكد من الرقمين وحاول مرة أخرى.</p></div>`;
  });
  if (params.get('no')) $('#ph').focus();
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
pages.notfound = () => { $('#app').innerHTML = `<div class="wrap page">${emptyBox('الصفحة التي تبحث عنها غير موجودة.', '/', 'العودة للرئيسية')}</div>`; };
pages.policies = () => {
  const s = (id, t, body) => `<section id="${id}"><h2>${t}</h2>${body}</section>`;
  $('#app').innerHTML = `<div class="wrap page"><h1 style="margin-bottom:24px">السياسات والمعلومات</h1><div class="legal">
  ${s('shipping', 'الشحن والتوصيل', `<p>نوصل لجميع محافظات مصر. رسوم الشحن ${money(K.shippingFee)}، ويصبح الشحن مجانيًا للطلبات بقيمة ${money(K.freeShipFrom)} أو أكثر.</p><p>نتصل بك لتأكيد الطلب قبل الشحن، ويمكنك متابعة حالته من صفحة <a href="/track.html">تتبع طلبك</a>.</p>`)}
  ${s('payment', 'طرق الدفع', '<p>ندعم الدفع أونلاين (بطاقة أو محفظة إلكترونية) والتحويل عبر إنستا باي. يتم تأكيد الطلب بعد وصول الدفع.</p>')}
  ${s('returns', 'الاستبدال والاسترجاع', '<p>يمكنك طلب استبدال المنتج خلال 14 يومًا من الاستلام بشرط أن يكون بحالته الأصلية وغير مستخدم. للمنتجات التالفة أو الخاطئة نتحمل تكلفة الاستبدال.</p>')}
  ${s('privacy', 'سياسة الخصوصية', '<p>نجمع الاسم ورقم الموبايل والبريد والعنوان فقط لتجهيز طلبك وتوصيله، ولا نشارك بياناتك مع أي جهة غير شركة الشحن. عند البحث بالصورة تُرسل الصورة للتحليل فقط ولا تُحفظ. يمكنك طلب حذف بياناتك بالتواصل معنا.</p>')}
  ${s('terms', 'الشروط والأحكام', '<p>الأسعار بالجنيه المصري وقد تتغير دون إشعار مسبق، ويُحاسب العميل بالسعر المعروض وقت تأكيد الطلب. نحتفظ بحق إلغاء الطلب في حال نفاد المخزون مع إبلاغ العميل.</p>')}</div></div>`;
};
})();
