/* =====================================================================
 * js/seller/payouts.js
 * الوظيفة: مدفوعات البائع وطلب السحب (kt_request_payout).
 * يعتمد على: js/seller/shared.js [BASE, field, tbl, balance, stat, pgh, pages] · window.Panel [sb, $, esc, money, moneyT, dt, ic, toast, modal, empty, badge]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, esc, money, moneyT, dt, ic, toast, modal, empty, badge } = window.Panel;
const { BASE, field, tbl, balance, stat, pgh, pages } = NS;   // js/seller/shared.js

/* ===================== #seller-payouts: المدفوعات ===================== */
// #seller #payouts #balance
// #page-payouts #route #seller #payouts
pages.payouts = async (el, c) => {
  const [bal, { data: po }] = await Promise.all([balance(c.store.id), sb.from('kt_payouts').select('*').eq('store_id', c.store.id).order('created_at', { ascending: false })]);
  const withdrawable = Math.max(0, bal.net - bal.paid - bal.pending - Math.max(0, bal.ad_spent - bal.ad_credit));
  el.innerHTML = pgh('المدفوعات', 'أرباحك من الطلبات المُسلّمة بعد خصم العمولة', `<button class="btn btn-p" id="rq" ${withdrawable < 100 ? 'disabled' : ''}>${ic('cash', 'sm')} طلب سحب</button>`) +
    `<div class="grid g4 keep2">${stat('wallet', 'متاح للسحب', money(withdrawable), withdrawable < 100 ? 'الحد الأدنى للسحب 100 جنيه' : '', 'stat--hl')}${stat('cash', 'إجمالي المبيعات المُسلّمة', money(bal.gross))}${stat('tag', `عمولة Kitchenly (${c.store.commission_rate}%)`, money(bal.commission))}${stat('check', 'تم تحويله لك', money(bal.paid), bal.pending ? `${moneyT(bal.pending)} قيد التحويل` : '')}</div>
    <div class="card" style="margin:16px 0"><h3 style="margin-bottom:8px">كيف يُحسب رصيدك؟</h3><ul class="rows"><li><span>مبيعات الطلبات المُسلّمة</span><b>${moneyT(bal.gross)}</b></li><li><span>− عمولة Kitchenly</span><b>${moneyT(bal.commission)}</b></li><li><span>− تحويلات تمت أو قيد التنفيذ</span><b>${moneyT(bal.paid + bal.pending)}</b></li><li><span>− إنفاق الإعلانات</span><b>${moneyT(bal.ad_spent)}</b></li><li><span>+ رصيد إعلاني مُهدى</span><b>${moneyT(bal.ad_credit)}</b></li><li><span><b>الرصيد المتاح</b></span><b>${moneyT(bal.available)}</b></li></ul></div>` +
    `<div class="card__head"><h3>سجل التحويلات</h3></div>` + tbl(['التاريخ', 'المبلغ', 'الطريقة', 'الحساب', 'الحالة'], (po || []).map(p => `<tr><td>${dt(p.created_at)}</td><td>${money(p.amount)}</td><td>${{ instapay: 'إنستا باي', wallet: 'محفظة إلكترونية', bank: 'حساب بنكي' }[p.method] || esc(p.method)}</td><td dir="ltr" style="text-align:start">${esc(p.account)}</td><td>${badge(p.status === 'paid' ? 'b-ok' : p.status === 'rejected' ? 'b-red' : 'b-warn', { paid: 'تم التحويل', pending: 'قيد التنفيذ', rejected: 'مرفوض' }[p.status])}${p.note ? `<span class="sub">${esc(p.note)}</span>` : ''}</td></tr>`), empty('cash', 'لا تحويلات بعد'));
  $('#rq').onclick = () => {
    if (!c.store.payout_account) { modal(`<div class="dlg"><h2>أضف بيانات الاستلام أولًا</h2><p>حدد حساب إنستا باي أو المحفظة من الإعدادات.</p><div class="dlg__foot"><a class="btn btn-p" data-l href="${BASE}/dashboard/settings" onclick="this.closest('dialog').close()">فتح الإعدادات</a></div></div>`); return; }
    const d = modal(`<form id="pf" novalidate><h2>طلب سحب</h2><p>سيُحوَّل إلى <b dir="ltr">${esc(c.store.payout_account)}</b></p>${field('am', 'المبلغ (جنيه)', `type="number" min="100" max="${Math.floor(withdrawable)}" step="1" value="${Math.floor(withdrawable)}"`, `المتاح ${moneyT(withdrawable)}، والحد الأدنى 100 جنيه`)}<p id="err" class="alert" hidden></p><div class="dlg__foot"><button type="button" class="btn btn-g" id="x">إلغاء</button><button class="btn btn-p">تأكيد الطلب</button></div></form>`);
    $('#x', d).onclick = () => d.close();
    $('#pf', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), amt = +$('#am', d).value; if (!(amt >= 100) || amt > withdrawable) { err.textContent = 'اكتب مبلغًا بين 100 والمتاح'; err.hidden = false; return; } const { error } = await sb.rpc('kt_request_payout', { p_amount: amt }); if (error) { err.textContent = /exceeds/.test(error.message) ? 'المبلغ أكبر من المتاح' : 'تعذر تنفيذ الطلب'; err.hidden = false; return; } d.close(); toast('تم إرسال طلب السحب'); pages.payouts(el, c); };
  };
};
})();
