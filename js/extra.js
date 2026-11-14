/* Kitchenly - صفحات إضافية: تقييمات المنتجات، البروفايل (/profile)، المساعدة، الخصوصية، السياسات، انضم إلينا، عروضك. */
(() => {
'use strict';
const A = window.KTApp;
const { K, sb, $, $$, esc, fmt, money, purl, curl, imgSrc, params, ic, stars, toast, Cart, db, loadCats, card, skeletons, errorBox, emptyBox, discount, STATUS, pages, requireLogin } = A;

const dateAr = d => new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const starSvg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

/* =====================================================================
   تقييمات المنتجات (حقيقية: التقييم لمن استلم المنتج فعلًا، والتحقق في قاعدة البيانات)
   ===================================================================== */
const RERR = {
  not_authenticated: 'سجّل الدخول أولًا', invalid_rating: 'اختر تقييمًا من نجمة إلى 5 نجوم', invalid_body: 'اكتب تعليقًا من 3 أحرف على الأقل',
  invalid_title: 'العنوان طويل، 80 حرفًا كحد أقصى', product_unavailable: 'هذا المنتج غير متاح حاليًا', not_purchased: 'التقييم متاح للعملاء الذين استلموا هذا المنتج فقط'
};
const rerr = e => RERR[(e?.message || '').trim()] || 'تعذر حفظ التقييم، حاول مرة أخرى';

function reviewForm(ex) {
  return `<form class="rform" novalidate>
    <div class="rate" role="radiogroup" aria-label="تقييمك" data-val="${ex?.rating || 0}">${[1, 2, 3, 4, 5].map(i => `<button type="button" role="radio" aria-checked="false" aria-label="${i} من 5" data-v="${i}" class="${ex && i <= ex.rating ? 'on' : ''}">${starSvg}</button>`).join('')}</div>
    <div><label class="lbl" for="rv-t">عنوان التقييم (اختياري)</label><input class="field" id="rv-t" maxlength="80" value="${esc(ex?.title || '')}" placeholder="مثال: منتج ممتاز"></div>
    <div><label class="lbl" for="rv-b">رأيك في المنتج</label><textarea class="field" id="rv-b" rows="4" maxlength="800" required placeholder="احكي تجربتك بعد الاستخدام">${esc(ex?.body || '')}</textarea></div>
    <p class="alert" role="alert" hidden></p>
    <div class="rform__act"><button class="btn btn-primary">${ex ? 'حفظ التعديل' : 'نشر التقييم'}</button>${ex ? '<button type="button" class="btn btn-ghost" data-del>حذف تقييمي</button>' : ''}</div></form>`;
}
function bindReviewForm(root, slug, ex, done) {
  const form = $('.rform', root), rate = $('.rate', form), err = $('.alert', form);
  const paint = v => { rate.dataset.val = v; $$('button', rate).forEach(b => { const on = +b.dataset.v <= v; b.classList.toggle('on', on); b.setAttribute('aria-checked', +b.dataset.v === v); }); };
  paint(+rate.dataset.val || 0);
  rate.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) paint(+b.dataset.v); });
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.hidden = true;
    const rating = +rate.dataset.val, body = $('#rv-b', form).value.trim(), title = $('#rv-t', form).value.trim();
    const show = m => { err.textContent = m; err.hidden = false; };
    if (!rating) return show(RERR.invalid_rating); if (body.length < 3) return show(RERR.invalid_body);
    const btn = $('button.btn-primary', form); btn.disabled = true;
    const { error } = await sb.rpc('kt_save_review', { p_slug: slug, p_rating: rating, p_title: title || null, p_body: body });
    btn.disabled = false; if (error) return show(rerr(error));
    toast(ex ? 'تم تعديل تقييمك' : 'شكرًا، تم نشر تقييمك'); done();
  });
  $('[data-del]', form)?.addEventListener('click', async () => {
    if (!confirm('متأكد من حذف تقييمك؟')) return;
    const { error } = await sb.rpc('kt_delete_review', { p_id: ex.id });
    if (error) return toast('تعذر حذف التقييم', 'err'); toast('تم حذف تقييمك'); done();
  });
}

/* قسم التقييمات داخل صفحة المنتج */
A.mountReviews = async (p, el) => {
  el.innerHTML = `<div class="sec__head"><div><h2>تقييمات العملاء</h2><p>آراء حقيقية من عملاء استلموا المنتج فعلًا</p></div></div><div id="rv-body"><div class="skel" style="height:140px"></div></div>`;
  const body = $('#rv-body', el);
  const draw = async () => {
    const [res, ses] = await Promise.all([
      sb.from('kt_product_reviews').select('id,user_id,reviewer_name,rating,title,body,created_at,updated_at').eq('product_id', p.id).order('created_at', { ascending: false }),
      A.getSession().catch(() => null)
    ]);
    if (res.error) { body.innerHTML = errorBox('تعذر تحميل التقييمات.'); return; }
    const list = res.data || [], n = list.length, avg = n ? list.reduce((a, r) => a + r.rating, 0) / n : 0;
    const head = $('#prod-rating'); if (head) head.innerHTML = n ? `${stars(avg)}<span>${avg.toFixed(1)} (${n} تقييم)</span>` : '<span class="newtag">لا تقييمات بعد، كن أول من يقيّم</span>';

    /* هل يحق له التقييم؟ لازم طلب مستلم فيه هذا المنتج */
    let mine = null, bought = false;
    if (ses) {
      mine = list.find(r => r.user_id === ses.user.id) || null;
      const { data } = await sb.from('kt_orders').select('items').eq('user_id', ses.user.id).eq('status', 'delivered');
      bought = (data || []).some(o => (o.items || []).some(i => i.slug === p.slug));
    }
    const dist = [5, 4, 3, 2, 1].map(s => { const c = list.filter(r => r.rating === s).length; return `<div class="dist__row"><span>${s}</span>${ic('star', 'ico-sm')}<i><b style="width:${n ? Math.round(c / n * 100) : 0}%"></b></i><em>${c}</em></div>`; }).join('');
    const summary = n ? `<div class="rv-sum card"><div class="rv-sum__big"><b>${avg.toFixed(1)}</b>${stars(avg)}<small>${n} تقييم</small></div><div class="dist">${dist}</div></div>` : '';
    const items = n ? `<ul class="rv-list">${list.map(r => `<li class="rv card"><div class="rv__top"><span class="rv__av" aria-hidden="true">${esc(r.reviewer_name.trim().charAt(0))}</span><div><b>${esc(r.reviewer_name)}</b><small>${dateAr(r.created_at)}${r.updated_at && r.updated_at !== r.created_at && Date.parse(r.updated_at) - Date.parse(r.created_at) > 60000 ? ' (معدّل)' : ''}</small></div><span class="rv__ok">${ic('check', 'ico-sm')}مشتري موثّق</span></div>${stars(r.rating)}${r.title ? `<h3>${esc(r.title)}</h3>` : ''}<p>${esc(r.body)}</p></li>`).join('')}</ul>` : `<div class="card empty" style="margin-top:12px"><p>لا توجد تقييمات لهذا المنتج حتى الآن.</p></div>`;

    let action;
    if (!ses) action = `<div class="card rv-cta"><div><b>اشتريت هذا المنتج؟</b><p>سجّل دخولك لتقييمه ومساعدة العملاء الآخرين.</p></div><a class="btn btn-primary" href="/auth.html?next=${encodeURIComponent(location.pathname)}">تسجيل الدخول</a></div>`;
    else if (bought) action = `<div class="card rv-form"><h3>${mine ? 'عدّل تقييمك' : 'قيّم هذا المنتج'}</h3>${reviewForm(mine)}</div>`;
    else action = `<div class="card rv-cta"><div><b>التقييم لمن استلم المنتج</b><p>ليكون كل تقييم حقيقيًا، يتفعّل التقييم بعد وصول طلبك وتغيّر حالته إلى "تم التسليم".</p></div><a class="btn btn-ghost" href="/profile/my-orders">طلباتي</a></div>`;
    body.innerHTML = `<div class="rv-grid"><div>${summary}${items}</div><div>${action}</div></div>`;
    if (ses && bought) bindReviewForm(body, p.slug, mine, draw);
  };
  try { await draw(); } catch (e) { console.error(e); body.innerHTML = errorBox('تعذر تحميل التقييمات.'); }
};

/* =====================================================================
   البروفايل: /profile  /profile/my-orders  /profile/my-reviews
   ===================================================================== */
const PNAV = [['/profile', 'profile', 'حسابي', 'user'], ['/profile/my-orders', 'myorders', 'طلباتي', 'box'], ['/profile/my-reviews', 'myreviews', 'تقييماتي', 'star'], ['/help', 'help', 'المساعدة', 'help']];
async function profileShell(active, title, sub) {
  if (!(await requireLogin())) return null;
  const u = A.session.user, nm = u.user_metadata?.name || '';
  $('#app').innerHTML = `<div class="wrap page"><div class="pshell">
    <aside class="pnav card"><div class="pnav__me"><span class="rv__av lg" aria-hidden="true">${esc((nm || u.email).trim().charAt(0).toUpperCase())}</span><div><b>${esc(nm || 'عميل Kitchenly')}</b><small dir="ltr">${esc(u.email)}</small></div></div>
      <nav class="pnav__links" aria-label="حسابي">${PNAV.map(([h, k, t, i]) => `<a href="${h}" ${k === active ? 'aria-current="page"' : ''}>${ic(i)}<span>${t}</span></a>`).join('')}<a href="/admin" id="adm" hidden>${ic('grid')}<span>لوحة التحكم</span></a><button type="button" id="out">${ic('logout')}<span>تسجيل الخروج</span></button></nav></aside>
    <section class="pmain"><h1>${title}</h1>${sub ? `<p class="page__sub">${sub}</p>` : ''}<div id="pbody" style="margin-top:20px"><div class="skel" style="height:160px"></div></div></section></div></div>`;
  $('#out').onclick = async () => { await sb.auth.signOut({ scope: 'local' }); location.href = '/'; };
  sb.rpc('kt_is_admin').then(({ data }) => { if (data === true) $('#adm').hidden = false; });
  return u;
}
/* طلبات العميل + المنتجات المستلمة التي لم يقيّمها بعد + تقييماته */
async function loadMine(uid) {
  const [o, r] = await Promise.all([
    sb.from('kt_orders').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    sb.from('kt_product_reviews').select('id,product_id,rating,title,body,created_at,updated_at').eq('user_id', uid).order('created_at', { ascending: false })
  ]);
  if (o.error || r.error) throw (o.error || r.error);
  const orders = o.data || [], reviews = r.data || [];
  const delivered = new Map(); orders.filter(x => x.status === 'delivered').forEach(x => (x.items || []).forEach(i => { if (!delivered.has(i.slug)) delivered.set(i.slug, i); }));
  const ids = reviews.map(x => x.product_id), prodBySlug = new Map(), prodById = new Map();
  const [bySlug, byId] = await Promise.all([
    delivered.size ? sb.from('kt_products').select('id,slug,name,image').in('slug', [...delivered.keys()]) : { data: [] },
    ids.length ? sb.from('kt_products').select('id,slug,name,image').in('id', ids) : { data: [] }
  ]);
  (bySlug.data || []).forEach(x => prodBySlug.set(x.slug, x)); (byId.data || []).forEach(x => prodById.set(x.id, x));
  const reviewed = new Set(ids);
  const pending = [...delivered.keys()].map(sl => prodBySlug.get(sl)).filter(x => x && !reviewed.has(x.id));
  return { orders, reviews: reviews.map(x => ({ ...x, product: prodById.get(x.product_id) })), pending };
}
const prodRow = (p, extra = '') => `<div class="prow"><a href="${purl(p)}"><img src="${esc(imgSrc(p))}" alt=""></a><div class="prow__b"><a href="${purl(p)}">${esc(p.name)}</a>${extra}</div></div>`;

pages.profile = async () => {
  const u = await profileShell('profile', 'حسابي', 'بياناتك وملخص نشاطك في المتجر'); if (!u) return;
  const body = $('#pbody');
  try {
    const { orders, reviews, pending } = await loadMine(u.id);
    const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    body.innerHTML = `<div class="stats">
      <a class="stat card" href="/profile/my-orders"><b>${orders.length}</b><span>طلباتي</span></a>
      <a class="stat card" href="/profile/my-orders"><b>${active}</b><span>طلبات جارية</span></a>
      <a class="stat card" href="/profile/my-reviews"><b>${reviews.length}</b><span>تقييماتي</span></a>
      <a class="stat card ${pending.length ? 'stat--hl' : ''}" href="/profile/my-reviews"><b>${pending.length}</b><span>بانتظار تقييمك</span></a></div>
    ${active ? `<div class="card ptrack"><div>${ic('truck', 'ico-lg')}<b>عندك ${active} ${active === 1 ? 'طلب جاري' : 'طلبات جارية'}</b></div><a class="btn btn-primary btn-sm" href="/track.html">تتبّع الآن</a></div>` : ''}
    <h2 class="subhead">بيانات الحساب</h2>
    <form id="pf" class="card" style="padding:20px;display:grid;gap:14px;max-width:520px" novalidate>
      <div><label class="lbl" for="pn">الاسم (يظهر مع تقييماتك)</label><input class="field" id="pn" maxlength="60" value="${esc(u.user_metadata?.name || '')}" autocomplete="name"></div>
      <div><label class="lbl" for="pe">البريد الإلكتروني</label><input class="field" id="pe" value="${esc(u.email)}" dir="ltr" disabled></div>
      <p class="alert" id="pf-err" role="alert" hidden></p><button class="btn btn-primary" style="justify-self:start">حفظ</button></form>`;
    $('#pf').addEventListener('submit', async e => {
      e.preventDefault(); const name = $('#pn').value.trim(), err = $('#pf-err'); err.hidden = true;
      if (!name) { err.textContent = 'اكتب اسمك'; err.hidden = false; return; }
      const { error } = await sb.auth.updateUser({ data: { name } });
      if (error) { err.textContent = 'تعذر حفظ الاسم، حاول مرة أخرى'; err.hidden = false; return; }
      toast('تم حفظ بياناتك'); $('.pnav__me b').textContent = name;
    });
  } catch (e) { console.error(e); body.innerHTML = errorBox(); }
};

pages.myorders = async () => {
  const u = await profileShell('myorders', 'طلباتي', 'كل طلباتك، وتقدر تتبّع أي طلب بضغطة واحدة'); if (!u) return;
  const body = $('#pbody');
  let data; try { data = await loadMine(u.id); } catch (e) { console.error(e); body.innerHTML = errorBox(); return; }
  const { orders } = data, FILTERS = [['all', 'الكل', () => true], ['open', 'جارية', o => !['delivered', 'cancelled'].includes(o.status)], ['done', 'تم التسليم', o => o.status === 'delivered'], ['cancel', 'ملغية', o => o.status === 'cancelled']];
  let cur = 'all';
  const draw = () => {
    const f = FILTERS.find(x => x[0] === cur)[2], list = orders.filter(f);
    body.innerHTML = `<div class="chips-row">${FILTERS.map(([k, t, fn]) => `<button class="chip" data-f="${k}" aria-current="${k === cur}">${t} (${orders.filter(fn).length})</button>`).join('')}</div>
    <div style="display:grid;gap:16px;margin-top:16px">${list.length ? list.map(o => `<div class="ordwrap">${A.orderCard(o)}<div class="ordwrap__act"><a class="btn btn-primary btn-sm" href="/track.html?no=${encodeURIComponent(o.order_no)}">${ic('box', 'ico-sm')}تتبّع الطلب</a>${o.status === 'delivered' ? '<a class="btn btn-ghost btn-sm" href="/profile/my-reviews">قيّم منتجاتك</a>' : ''}${['new', 'confirmed'].includes(o.status) ? '<a class="btn btn-ghost btn-sm" href="/policy#cancel">إلغاء الطلب</a>' : ''}</div></div>`).join('') : emptyBox(orders.length ? 'لا توجد طلبات في هذا التصنيف.' : 'لا توجد طلبات على حسابك بعد.', '/shop.html', 'ابدأ التسوق', 'orders')}</div>`;
    $$('[data-f]', body).forEach(b => b.onclick = () => { cur = b.dataset.f; draw(); });
  };
  draw();
};

pages.myreviews = async () => {
  const u = await profileShell('myreviews', 'تقييماتي', 'قيّم المنتجات التي استلمتها وعدّل تقييماتك السابقة'); if (!u) return;
  const body = $('#pbody');
  const dlg = document.createElement('dialog'); dlg.setAttribute('aria-label', 'تقييم المنتج'); document.body.appendChild(dlg);
  const load = async () => {
    let d; try { d = await loadMine(u.id); } catch (e) { console.error(e); body.innerHTML = errorBox(); return; }
    const open = (p, ex) => {
      dlg.innerHTML = `<div style="padding:22px;display:grid;gap:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 style="font-size:1.15rem">${ex ? 'تعديل تقييمك' : 'قيّم'}: ${esc(p.name)}</h2><button class="icon-btn" data-x aria-label="إغلاق">${ic('x')}</button></div>${reviewForm(ex)}</div>`;
      bindReviewForm(dlg, p.slug, ex, () => { dlg.close(); load(); });
      $('[data-x]', dlg).onclick = () => dlg.close(); dlg.showModal();
    };
    body.innerHTML = `<h2 class="subhead" style="margin-top:0">بانتظار تقييمك (${d.pending.length})</h2>
    ${d.pending.length ? `<div class="plist">${d.pending.map(p => `<div class="card">${prodRow(p, '<span class="rv__hint">تم التسليم، شاركنا رأيك</span>')}<button class="btn btn-primary btn-sm" data-rate="${esc(p.slug)}">قيّم المنتج</button></div>`).join('')}</div>` : emptyBox('لا توجد منتجات بانتظار التقييم. تظهر هنا المنتجات بعد تسليم طلبك.', '/shop.html', 'تصفّح المنتجات')}
    <h2 class="subhead">تقييماتي (${d.reviews.length})</h2>
    ${d.reviews.length ? `<ul class="rv-list">${d.reviews.map((r, i) => `<li class="rv card">${r.product ? prodRow(r.product) : '<b>منتج غير متاح حاليًا</b>'}<div style="margin-top:8px">${stars(r.rating)}</div>${r.title ? `<h3>${esc(r.title)}</h3>` : ''}<p>${esc(r.body)}</p><small style="color:var(--muted)">${dateAr(r.created_at)}</small>
      <div class="rform__act" style="margin-top:10px">${r.product ? `<button class="btn btn-ghost btn-sm" data-edit="${i}">${ic('edit', 'ico-sm')}تعديل</button>` : ''}<button class="btn btn-ghost btn-sm" data-del="${esc(r.id)}">${ic('trash', 'ico-sm')}حذف</button></div></li>`).join('')}</ul>` : emptyBox('لم تكتب أي تقييم بعد.', '/shop.html', 'تصفّح المنتجات')}`;
    $$('[data-rate]', body).forEach(b => b.onclick = () => open(d.pending.find(p => p.slug === b.dataset.rate), null));
    $$('[data-edit]', body).forEach(b => b.onclick = () => { const r = d.reviews[+b.dataset.edit]; open(r.product, r); });
    $$('[data-del]', body).forEach(b => b.onclick = async () => { if (!confirm('متأكد من حذف هذا التقييم؟')) return; const { error } = await sb.rpc('kt_delete_review', { p_id: b.dataset.del }); if (error) return toast('تعذر حذف التقييم', 'err'); toast('تم حذف التقييم'); load(); });
  };
  load();
};

/* =====================================================================
   عروضك: /yours-offer  (عروض مرتبة حسب اهتمامك: السلة، اللي شاهدته، واللي اشتريته)
   ===================================================================== */
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

/* =====================================================================
   المساعدة: /help
   ===================================================================== */
pages.help = () => {
  const pays = Object.values(K.payments || {}).filter(v => v.enabled).map(v => v.label).join(' أو ');
  const FAQ = [
    ['كيف أطلب من المتجر؟', `أضف المنتجات إلى السلة، ثم اضغط "إتمام الطلب" واكتب اسمك ورقم موبايلك وعنوانك واختر طريقة الدفع. تقدر تشتري بدون حساب، لكن الحساب يخلّيك تتابع طلباتك وتقيّم المنتجات.`],
    ['كم تكلفة الشحن؟', `رسوم الشحن ${money(K.shippingFee)}، ويكون الشحن مجانيًا للطلبات بقيمة ${money(K.freeShipFrom)} أو أكثر. نوصل لجميع محافظات مصر.`],
    ['ما طرق الدفع المتاحة؟', `${pays || 'الدفع أونلاين أو إنستا باي'}. بعد تأكيد الطلب تظهر لك تعليمات الدفع في صفحة نجاح الطلب.`],
    ['كيف أتتبّع طلبي؟', 'لو سجّلت دخولك: ادخل على <a href="/profile/my-orders">طلباتي</a> واضغط "تتبّع الطلب" فتفتح حالة الطلب مباشرة بدون كتابة أي بيانات. وبعد الطلب مباشرة يفتح لك زر "تتبع الطلب" نفس الشيء. لو بدون حساب: من <a href="/track.html">تتبع طلبك</a> اكتب رقم الطلب ورقم الموبايل.'],
    ['ماذا تعني حالات الطلب؟', 'تم استلام الطلب ← تم التأكيد ← في الطريق إليك ← تم التسليم. ولو تم إلغاء الطلب تظهر حالته "ملغي".'],
    ['كيف أقيّم منتج؟', 'التقييم متاح للعملاء الذين استلموا المنتج فعلًا، حتى تكون كل التقييمات حقيقية. بعد تغيّر حالة طلبك إلى "تم التسليم" ادخل على صفحة المنتج أو <a href="/profile/my-reviews">تقييماتي</a> واكتب رأيك. تقدر تعدّل تقييمك أو تحذفه في أي وقت.'],
    ['لماذا لا أستطيع تقييم منتج؟', 'غالبًا لأن طلبك لم يصل حالة "تم التسليم" بعد، أو لأنك غير مسجّل الدخول بنفس الحساب الذي طلبت منه.'],
    ['كيف أستبدل منتج؟', 'يمكنك طلب الاستبدال خلال 14 يومًا من الاستلام بشرط أن يكون المنتج بحالته الأصلية وغير مستخدم. تواصل معنا ومعك رقم الطلب. التفاصيل في <a href="/policy#returns">سياسة الاستبدال والاسترجاع</a>.'],
    ['نسيت كلمة المرور، أعمل إيه؟', 'من صفحة <a href="/auth.html">تسجيل الدخول</a> اختر "الدخول بكود يصلك على الإيميل" وسيصلك كود تدخل به مباشرة.'],
    ['ما هي صفحة "عروضك"؟', 'صفحة <a href="/yours-offer">عروضك</a> ترتّب لك المنتجات المخفّضة حسب اهتمامك: الأقسام التي تصفحتها أو أضفتها للسلة أو اشتريت منها.'],
    ['كيف يعمل البحث بالصورة؟', 'اضغط أيقونة الكاميرا في شريط البحث وارفع صورة المنتج، وسنقترح أقرب المنتجات الموجودة عندنا.']
  ];
  $('#app').innerHTML = `<div class="wrap page"><div class="help"><h1>مركز المساعدة</h1><p class="page__sub">إجابات سريعة لأكثر الأسئلة شيوعًا، ولو ما لقيت إجابتك تواصل معنا.</p>
  <div class="sbox help__q" style="margin-top:20px"><input id="hq" type="search" placeholder="ابحث في الأسئلة" aria-label="ابحث في الأسئلة"><span style="padding:0 12px;color:var(--muted)">${ic('search')}</span></div>
  <div class="quick">${[['/profile/my-orders', 'box', 'طلباتي'], ['/track.html', 'truck', 'تتبع طلبك'], ['/profile/my-reviews', 'star', 'تقييماتي'], ['/policy', 'shield', 'السياسات']].map(([h, i, t]) => `<a class="card quick__i" href="${h}">${ic(i, 'ico-lg')}<span>${t}</span></a>`).join('')}</div>
  <div id="faq" class="faq">${FAQ.map(([q, a]) => `<details class="card"><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
  <p id="faq-empty" class="card empty" hidden><span>لا توجد نتيجة مطابقة، جرّب كلمات أخرى أو تواصل معنا.</span></p>
  <div class="card help__contact"><div><h2>لسه محتاج مساعدة؟</h2><p>فريق خدمة العملاء يرد عليك يوميًا من 9 صباحًا إلى 9 مساءً.</p></div>
  <div class="help__btns"><a class="btn btn-sun" href="https://wa.me/${K.whatsapp}" target="_blank" rel="noopener">${ic('phone', 'ico-sm')}واتساب</a><a class="btn btn-ghost" href="/contact.html">${ic('mail', 'ico-sm')}راسلنا</a></div></div></div></div>`;
  const items = $$('#faq details'), norm = A.norm;
  $('#hq').addEventListener('input', e => { const q = norm(e.target.value); let n = 0; items.forEach(d => { const hit = !q || norm(d.textContent).includes(q); d.hidden = !hit; if (hit) n++; if (q && hit) d.open = true; else if (!q) d.open = false; }); $('#faq-empty').hidden = n > 0; });
};

/* =====================================================================
   السياسات: /policy  و  /privacy
   ===================================================================== */
const legalMedia = m => !m ? '' : m === 'PAY' ? `<div class="legal__media legal__media--pay">${A.payLogos(['instapay'])}${A.payLogos(['paymob', 'visa'])}</div>` : `<div class="legal__media"><img src="/assets/img/pages/${m}" alt="" loading="lazy" decoding="async"></div>`;
const legal = (title, updated, sections) => {
  $('#app').innerHTML = `<div class="wrap page"><div class="legal"><div><h1>${title}</h1><p class="page__sub">آخر تحديث: ${updated}</p></div>
  <nav class="legal__toc card" aria-label="المحتويات">${sections.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav>
  ${sections.map(([id, t, body, media]) => `<section id="${id}"><div class="legal__row ${media ? 'has-media' : ''}"><div class="legal__txt"><h2>${t}</h2>${body}</div>${legalMedia(media)}</div></section>`).join('')}</div></div>`;
  if (location.hash) $(location.hash)?.scrollIntoView();
};
const LAST = 'نوفمبر 2026';

pages.policy = () => legal('سياسات المتجر', LAST, [
  ['shipping', 'الشحن والتوصيل', `<p>نوصل لجميع محافظات مصر. رسوم الشحن ${money(K.shippingFee)}، ويصبح الشحن مجانيًا للطلبات بقيمة ${money(K.freeShipFrom)} أو أكثر.</p><p>نتصل بك لتأكيد الطلب قبل الشحن ونبلغك بموعد التوصيل المتوقع. تقدر تتابع حالة الطلب لحظة بلحظة من <a href="/track.html">تتبع طلبك</a>، أو من <a href="/profile/my-orders">طلباتي</a> لو عندك حساب.</p><p>يرجى التأكد من صحة العنوان ورقم الموبايل، لأن التوصيل يتم عليهما.</p>`, 'shipping-truck.webp'],
  ['payment', 'طرق الدفع', '<p>ندعم الدفع أونلاين (بطاقة بنكية أو محفظة إلكترونية) والتحويل عبر إنستا باي. يتم تأكيد الطلب بعد وصول الدفع، وتظهر لك تعليمات الدفع بعد إتمام الطلب مباشرة.</p>', 'PAY'],
  ['returns', 'الاستبدال والاسترجاع', '<p>يمكنك طلب استبدال المنتج خلال 14 يومًا من الاستلام بشرط أن يكون بحالته الأصلية وغير مستخدم، ومعه الغلاف أو العبوة قدر الإمكان.</p><p>للمنتجات التالفة أو الخاطئة نتحمل تكلفة الاستبدال بالكامل. للبدء تواصل معنا عبر <a href="/contact.html">صفحة التواصل</a> أو واتساب ومعك رقم الطلب.</p>', 'returns.webp'],
  ['cancel', 'إلغاء الطلب', '<p>يمكنك طلب إلغاء الطلب قبل شحنه بالتواصل معنا. بعد خروج الطلب للتوصيل يتم التعامل معه وفق سياسة الاستبدال. نحتفظ بحق إلغاء الطلب في حال نفاد المخزون أو تعذّر التواصل معك، مع إبلاغك.</p>', 'cancel-order.webp'],
  ['reviews', 'سياسة التقييمات', '<p>التقييم متاح فقط للعملاء الذين استلموا المنتج فعلًا (حالة الطلب "تم التسليم")، وتقييم واحد لكل منتج لكل حساب، ويمكن تعديله أو حذفه في أي وقت من <a href="/profile/my-reviews">تقييماتي</a>.</p><p>يظهر التقييم باسمك المسجّل في الحساب. نحتفظ بحق إزالة أي تقييم يحتوي على إساءة أو إعلانات أو بيانات شخصية.</p><p>متوسط تقييم المنتج وعدد التقييمات يُحسبان تلقائيًا من التقييمات الحقيقية فقط.</p>', 'reviews.webp'],
  ['terms', 'الشروط والأحكام', '<p>الأسعار بالجنيه المصري وقد تتغير دون إشعار مسبق، ويُحاسب العميل بالسعر المعروض وقت تأكيد الطلب. صور المنتجات للتوضيح وقد يختلف اللون أو العبوة قليلًا.</p><p>تشمل الشروط والأحكام بنود <a href="#shipping">الشحن والتوصيل</a> و<a href="#returns">الاستبدال والاسترجاع</a> و<a href="#cancel">إلغاء الطلب</a> و<a href="#reviews">سياسة التقييمات</a>.</p><p>باستخدامك للمتجر فأنت توافق على هذه السياسات وعلى <a href="/privacy">سياسة الخصوصية</a>.</p>', 'terms.webp']
]);

pages.privacy = () => legal('سياسة الخصوصية', LAST, [
  ['intro', 'مقدمة', '<p>نحترم خصوصيتك. توضح هذه الصفحة ما البيانات التي يجمعها متجر Kitchenly، ولماذا، ومع من تُشارك، وكيف تتحكم فيها.</p>'],
  ['collect', 'البيانات التي نجمعها', `<ul class="legal__ul"><li><b>بيانات الطلب:</b> الاسم، رقم الموبايل، المحافظة والعنوان، وملاحظاتك، وما طلبته.</li><li><b>بيانات الحساب (اختياري):</b> البريد الإلكتروني والاسم. كلمة المرور تُحفظ مشفّرة لدى مزوّد المصادقة ولا نراها.</li><li><b>التقييمات:</b> النجوم والتعليق والعنوان الذي تكتبه، ويظهر علنًا باسمك المسجّل.</li><li><b>الرسائل وطلبات الانضمام:</b> ما تكتبه في صفحة <a href="/contact.html">تواصل معنا</a> أو <a href="/join-us">انضم إلينا</a>.</li><li><b>الاشتراك في العروض:</b> بريدك الإلكتروني فقط.</li><li><b>البحث بالصورة:</b> الصورة التي ترفعها للتحليل فقط.</li></ul>`],
  ['use', 'كيف نستخدم بياناتك', '<p>نستخدمها لتجهيز طلبك وتوصيله وتأكيده معك، وعرض حالة الطلب، وعرض التقييمات، والرد على رسائلك، وإرسال العروض لمن اشترك فيها، وترتيب العروض المناسبة لك في صفحة <a href="/yours-offer">عروضك</a>.</p>'],
  ['share', 'مع من نشاركها', '<ul class="legal__ul"><li><b>شركة الشحن:</b> الاسم والعنوان ورقم الموبايل لتوصيل الطلب.</li><li><b>مزوّد الدفع:</b> عند اختيار الدفع أونلاين فقط.</li><li><b>مزوّد الاستضافة وقاعدة البيانات (Supabase):</b> لتخزين بيانات المتجر والحسابات.</li><li><b>خدمة الذكاء الاصطناعي (Google Gemini):</b> يُرسل لها نص البحث أو صورة البحث بالصورة فقط لاقتراح المنتجات، ولا تُحفظ الصورة عندنا.</li></ul><p>لا نبيع بياناتك لأي جهة.</p>'],
  ['storage', 'التخزين على جهازك', '<p>نحفظ على متصفحك: محتويات السلة، آخر المنتجات التي شاهدتها، وآخر طلب تم من الجهاز (رقم الطلب ورقم الموبايل) ليفتح لك التتبع تلقائيًا، وجلسة الدخول إن سجّلت دخولك. لا نستخدم ملفات تتبع إعلانية. يمكنك مسح هذه البيانات في أي وقت من إعدادات المتصفح.</p>'],
  ['security', 'حماية البيانات', '<p>الاتصال بالموقع مشفّر، وصلاحيات قاعدة البيانات تمنع أي عميل من رؤية طلبات أو بيانات عميل آخر. مع ذلك لا توجد وسيلة نقل أو تخزين آمنة بنسبة 100%، ونعمل على تحسين الحماية باستمرار.</p>'],
  ['rights', 'حقوقك', '<p>يمكنك الاطلاع على بياناتك وتعديل اسمك من <a href="/profile">حسابي</a>، وتعديل تقييماتك أو حذفها من <a href="/profile/my-reviews">تقييماتي</a>. ولطلب حذف حسابك وبياناتك أو إلغاء الاشتراك في العروض تواصل معنا وسنستجيب في أقرب وقت.</p>'],
  ['contact', 'تواصل معنا بخصوص الخصوصية', `<p>لأي استفسار عن هذه السياسة: <a href="/contact.html">صفحة التواصل</a> أو واتساب <a dir="ltr" href="https://wa.me/${K.whatsapp}" target="_blank" rel="noopener">${esc(K.phone)}</a>. قد نحدّث هذه السياسة من وقت لآخر وسيظهر تاريخ آخر تحديث أعلى الصفحة.</p>`]
]);

/* =====================================================================
   انضم إلينا: /join-us
   ===================================================================== */
pages.join = () => {
  const ROLES = [['delivery', 'مندوب توصيل', 'st-ship', 'وصّل طلبات Kitchenly في منطقتك'], ['partner', 'شريك بيع أو مورّد', 'box', 'اعرض منتجاتك معنا أو وفّرها لنا'], ['affiliate', 'تسويق بالعمولة', 'tag', 'روّج للمتجر وسجّل عملاءك'], ['team', 'العمل مع الفريق', 'users', 'خدمة عملاء، تجهيز طلبات، تصميم، وغيرها']];
  $('#app').innerHTML = `<div class="wrap page"><div class="join"><div class="join__hero">${ic('join', 'hero-ic')}<h1>انضم إلينا</h1></div><p class="page__sub">عايز تشتغل معانا أو تبقى شريك نجاح؟ اختر المجال واكتب بياناتك وهنتواصل معاك.</p>
  <form id="jf" class="card" style="padding:22px;display:grid;gap:16px;margin-top:20px" novalidate>
    <fieldset class="join__roles"><legend class="lbl">تحب تنضم كـ</legend>${ROLES.map(([k, t, i, d], n) => `<label class="role"><input type="radio" name="role" value="${t}" ${n === 0 ? 'checked' : ''}><span>${ic(i, 'ico-lg')}<b>${t}</b><small>${d}</small></span></label>`).join('')}</fieldset>
    <div class="form-grid two"><div><label class="lbl" for="jn">الاسم</label><input class="field" id="jn" required maxlength="80" autocomplete="name"></div><div><label class="lbl" for="jp">رقم الموبايل</label><input class="field" id="jp" required inputmode="numeric" maxlength="11" dir="ltr" placeholder="01xxxxxxxxx" autocomplete="tel"></div>
    <div><label class="lbl" for="je">البريد الإلكتروني (اختياري)</label><input class="field" id="je" type="email" dir="ltr" maxlength="100" autocomplete="email"></div><div><label class="lbl" for="jc">المحافظة / المنطقة</label><input class="field" id="jc" maxlength="60"></div></div>
    <div><label class="lbl" for="jm">عرّفنا بنفسك</label><textarea class="field" id="jm" rows="4" maxlength="500" placeholder="خبرتك، وإيه اللي تحب تعمله معانا"></textarea></div>
    <p class="alert" id="j-err" role="alert" hidden></p><button class="btn btn-primary" id="j-btn">إرسال الطلب</button></form>
  <div class="card empty join__ok" id="j-ok" hidden><span class="okmark">${ic('check', 'ico-lg')}</span><h2>وصل طلبك، شكرًا لك</h2><p>هنتواصل معاك على رقم الموبايل في أقرب وقت.</p><a class="btn btn-primary" href="/">العودة للرئيسية</a></div></div></div>`;
  $('#jf').addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#j-err'), v = Object.fromEntries(new FormData(e.currentTarget)), show = m => { err.textContent = m; err.hidden = false; };
    err.hidden = true; const name = $('#jn').value.trim(), phone = $('#jp').value.trim(), mail = $('#je').value.trim();
    if (!name) return show('اكتب اسمك'); if (!/^01[0-9]{9}$/.test(phone)) return show('رقم الموبايل يجب أن يكون 11 رقمًا ويبدأ بـ 01');
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return show('اكتب بريدًا إلكترونيًا صحيحًا');
    const text = `[طلب انضمام: ${v.role}] المحافظة: ${$('#jc').value.trim() || '-'}${mail ? ` | البريد: ${mail}` : ''}\n${$('#jm').value.trim()}`.slice(0, 1000);
    const b = $('#j-btn'); b.disabled = true;
    const { error } = await sb.from('kt_messages').insert({ name, phone, body: text });
    b.disabled = false; if (error) return show('تعذر إرسال الطلب، حاول مرة أخرى');
    $('#jf').hidden = true; $('#j-ok').hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

/* =====================================================================
   من نحن: /about  (صورة الفريق + أسباب الثقة)
   ===================================================================== */
pages.about = () => {
  const pts = [['box', 'تجهيز وتغليف بعناية', 'كل طلب بيتجهّز ويتراجع قبل ما يخرج، ويتغلّف بشكل يحميه في الطريق.'], ['truck', 'توصيل لكل المحافظات', `شحن لجميع محافظات مصر، ومجاني للطلبات فوق ${money(K.freeShipFrom)}.`], ['check', 'جودة مضمونة', 'منتجاتنا مختارة ومجرّبة، والاستبدال متاح خلال 14 يومًا.']];
  $('#app').innerHTML = `<div class="wrap page"><div class="about">
    <figure class="about__hero"><img src="/assets/img/states/team.webp" alt="فريق تجهيز وتغليف الطلبات في المخزن" width="1200" height="931" loading="eager" decoding="async"><figcaption><h1>إحنا Kitchenly</h1><p>فريق بيجهّز طلبك بإيده، من المخزن لباب بيتك.</p></figcaption></figure>
    <p class="about__lead">بدأنا Kitchenly عشان نوفّر أدوات تنظيف وتنظيم للمطبخ بجودة تعتمد عليها وسعر عادل. بنختار كل منتج بنفسنا، ونجهّز كل طلب بعناية، ونوصّله لحد بابك.</p>
    <div class="about__pts">${pts.map(([i, t, d]) => `<div class="card about__pt">${ic(i, 'ico-lg')}<h2>${t}</h2><p>${d}</p></div>`).join('')}</div>
    <div class="about__cta"><a class="btn btn-primary" href="/shop.html">ابدأ التسوق</a><a class="btn btn-ghost" href="/contact.html">تواصل معنا</a><a class="btn btn-ghost" href="/join-us">انضم إلينا</a></div></div></div>`;
};
})();
