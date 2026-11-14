/* =====================================================================
 * js/features/reviews.js
 * الوظيفة: تقييمات المنتجات (لمن استلم المنتج فعلًا): نموذج التقييم وعرضه داخل صفحة المنتج + أدوات صغيرة مشتركة (تاريخ، JSON، نجمة).
 * يعتمد على: window.KTApp [A, sb, $, $$, esc, ic, stars, toast, errorBox]
 * يعرض على window.KTApp: dateAr, readJSON, reviewForm, bindReviewForm
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const A = window.KTApp;
const { sb, $, $$, esc, ic, stars, toast, errorBox } = A;

/* ===================== #helpers: دوال صغيرة مشتركة (تاريخ عربي، قراءة JSON، نجمة) ===================== */
// #helpers #date #json

const dateAr = d => new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const starSvg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

/* ===================== #reviews: تقييمات المنتجات (التحقق في قاعدة البيانات) ===================== */
// #reviews #rating #form #verified-buyer
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

/* ===================== #reviews-section: قسم التقييمات داخل صفحة المنتج ===================== */
// #reviews #product #mount
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

Object.assign(NS, { dateAr, readJSON, reviewForm, bindReviewForm });
})();
