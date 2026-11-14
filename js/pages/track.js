/* =====================================================================
 * js/pages/track.js
 * الوظيفة: تتبع الطلب: خطوات الحالة وكارت الطلب والبحث برقم الموبايل.
 * يعتمد على: window.KTApp [sb, $, esc, money, params, ic, errorBox, STATUS, PAYNAME, pages]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const { sb, $, esc, money, params, ic, errorBox, STATUS, PAYNAME, pages } = window.KTApp;

/* ===================== #track: تتبع الطلب ===================== */
// #track #order #order-card #status-steps
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
// #page-track #route #track #order
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
})();
