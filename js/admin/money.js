/* =====================================================================
 * js/admin/money.js
 * الوظيفة: الأموال: دفعات البائعين (kt_payouts) وإيرادات الإعلانات والمتاجر.
 * يعتمد على: js/admin/shared.js [tbl, stat, pgh, reason, pages] · window.Panel [sb, $, $$, esc, money, moneyT, dt, ic, toast, ask, skel, empty, badge, sum, csv, loadSales]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, $$, esc, money, moneyT, dt, ic, toast, ask, skel, empty, badge, sum, csv, loadSales } = window.Panel;
const { tbl, stat, pgh, reason, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-money: الأموال ===================== */
// #admin #money #payouts #balance
// #page-money #route #admin #money
pages.money = async el => {
  let tab = 'overview';
  const draw = async () => {
    el.innerHTML = pgh('الأموال', 'المبيعات والعمولات وتحويلات البائعين') + skel(300);
    const [lines, { data: stores }, { data: pays }, { data: ads }] = await Promise.all([loadSales(null), sb.from('kt_stores').select('*'), sb.from('kt_payouts').select('*').order('created_at', { ascending: false }), sb.from('kt_ads').select('store_id,spent')]);
    const del = lines.filter(l => l.status === 'delivered'), sn = Object.fromEntries((stores || []).map(s => [s.id, s]));
    const rows = (stores || []).filter(s => s.status !== 'pending').map(s => {
      const g = sum(del.filter(l => l.store_id === s.id), l => l.total), com = g * s.commission_rate / 100, net = g - com, spent = sum((ads || []).filter(a => a.store_id === s.id), a => a.spent), paid = sum((pays || []).filter(p => p.store_id === s.id && p.status === 'paid'), p => p.amount), pend = sum((pays || []).filter(p => p.store_id === s.id && p.status === 'pending'), p => p.amount);
      return { s, g, com, net, spent, paid, pend, owed: net - paid - pend - Math.max(0, spent - s.ad_credit) };
    });
    const own = sum(del.filter(l => !l.store_id), l => l.total), com = sum(rows, r => r.com), adRev = sum(ads || [], a => a.spent), owedAll = sum(rows, r => Math.max(0, r.owed)), pendAll = (pays || []).filter(p => p.status === 'pending');
    const head = pgh('الأموال', 'المبيعات والعمولات وتحويلات البائعين', `<button class="btn btn-g" id="ex">${ic('dl', 'sm')} تصدير CSV</button>`) + `<div class="tabs">${[['overview', 'نظرة عامة'], ['requests', `طلبات السحب (${pendAll.length})`], ['history', 'سجل التحويلات']].map(([k, t]) => `<button data-t="${k}" aria-current="${tab === k}">${t}</button>`).join('')}</div>`;
    let body = '';
    if (tab === 'overview') body = `<div class="grid g4 keep2">${stat('cash', 'إيراد المنصة', money(own + com + adRev), 'منتجاتنا + عمولات + إعلانات', 'stat--hl')}${stat('tag', 'العمولات', money(com), 'من الطلبات المُسلّمة')}${stat('target', 'إيراد الإعلانات', money(adRev))}${stat('wallet', 'مستحق للبائعين', money(owedAll), `${moneyT(sum(pendAll, p => p.amount))} طلبات سحب معلّقة`)}</div><div class="grid g2 keep2" style="margin-top:16px">${stat('bag', 'مبيعات منتجاتنا (مُسلّمة)', money(own))}${stat('users', 'مبيعات المتاجر (مُسلّمة)', money(sum(rows, r => r.g)))}</div><div class="card__head" style="margin-top:22px"><h3>رصيد كل متجر</h3></div>` +
      tbl(['المتجر', 'مبيعات مُسلّمة', 'العمولة', 'صافي', 'إعلانات', 'تم تحويله', 'قيد التحويل', 'مستحق'], rows.map(r => `<tr><td><b>${esc(r.s.name)}</b><span class="sub">${r.s.commission_rate}%</span></td><td>${money(r.g)}</td><td>${money(r.com)}</td><td>${money(r.net)}</td><td>${money(r.spent)}</td><td>${money(r.paid)}</td><td>${money(r.pend)}</td><td><b>${money(Math.max(0, r.owed))}</b></td></tr>`), empty('wallet', 'لا متاجر بعد'));
    else if (tab === 'requests') body = tbl(['التاريخ', 'المتجر', 'المبلغ', 'الطريقة', 'الحساب', ''], pendAll.map(p => `<tr><td>${dt(p.created_at)}</td><td><b>${esc(sn[p.store_id]?.name || '-')}</b></td><td>${money(p.amount)}</td><td>${{ instapay: 'إنستا باي', wallet: 'محفظة', bank: 'بنكي' }[p.method] || esc(p.method)}</td><td dir="ltr" style="text-align:start">${esc(p.account)}</td><td class="act"><button class="btn btn-ok btn-sm" data-pd="${p.id}">تم التحويل</button> <button class="btn btn-d btn-sm" data-pr="${p.id}">رفض</button></td></tr>`), empty('check', 'لا طلبات سحب معلّقة'));
    else body = tbl(['التاريخ', 'المتجر', 'المبلغ', 'الحساب', 'الحالة'], (pays || []).filter(p => p.status !== 'pending').map(p => `<tr><td>${dt(p.paid_at || p.created_at)}</td><td>${esc(sn[p.store_id]?.name || '-')}</td><td>${money(p.amount)}</td><td dir="ltr" style="text-align:start">${esc(p.account)}</td><td>${badge(p.status === 'paid' ? 'b-ok' : 'b-red', p.status === 'paid' ? 'تم التحويل' : 'مرفوض')}${p.note ? `<span class="sub">${esc(p.note)}</span>` : ''}</td></tr>`), empty('wallet', 'لا تحويلات سابقة'));
    el.innerHTML = head + body;
    $$('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $('#ex').onclick = () => csv('money.csv', [['المتجر', 'مبيعات مُسلّمة', 'العمولة', 'الصافي', 'إعلانات', 'تم تحويله', 'قيد التحويل', 'مستحق'], ...rows.map(r => [r.s.name, r.g, r.com, r.net, r.spent, r.paid, r.pend, Math.max(0, r.owed)])]);
    $$('[data-pd]').forEach(b => b.onclick = async () => { const p = pays.find(x => x.id === b.dataset.pd); if (!(await ask(`تأكيد تحويل ${moneyT(p.amount)} إلى ${p.account}؟`, 'تم التحويل'))) return; const { error } = await sb.from('kt_payouts').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', p.id); toast(error ? 'تعذر التنفيذ' : 'تم تسجيل التحويل', error ? 'err' : ''); draw(); window.Panel.refresh(); });
    $$('[data-pr]').forEach(b => b.onclick = async () => { const r = await reason('رفض طلب السحب'); if (!r) return; const { error } = await sb.from('kt_payouts').update({ status: 'rejected', note: r }).eq('id', b.dataset.pr); toast(error ? 'تعذر التنفيذ' : 'تم رفض الطلب', error ? 'err' : ''); draw(); window.Panel.refresh(); });
  };
  await draw();
};
})();
