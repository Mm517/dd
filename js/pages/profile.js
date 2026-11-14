/* =====================================================================
 * js/pages/profile.js
 * الوظيفة: البروفايل /profile و /profile/my-orders و /profile/my-reviews.
 * يعتمد على: js/features/reviews.js [dateAr, reviewForm, bindReviewForm] · window.KTApp [A, sb, $, $$, esc, purl, imgSrc, ic, stars, toast, errorBox, emptyBox, pages, requireLogin]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const A = window.KTApp;
const { sb, $, $$, esc, purl, imgSrc, ic, stars, toast, errorBox, emptyBox, pages, requireLogin } = A;
const { dateAr, reviewForm, bindReviewForm } = NS;   // js/features/reviews.js

/* ===================== #profile: حسابي وطلباتي وتقييماتي ===================== */
// #profile #account #my-orders #my-reviews
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

// #page-profile #route #profile #account
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

// #page-myorders #route #profile #account
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

// #page-myreviews #route #profile #account
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
})();
