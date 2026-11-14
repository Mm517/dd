/* =====================================================================
 * js/admin/ads.js
 * الوظيفة: إدارة الإعلانات المموّلة (جدول kt_ads).
 * يعتمد على: js/admin/shared.js [tbl, stat, pgh, reason, pages] · window.Panel [sb, $$, esc, fmt, money, moneyT, toast, skel, empty, sBadge, AD, PLACE, sum]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $$, esc, fmt, money, moneyT, toast, skel, empty, sBadge, AD, PLACE, sum } = window.Panel;
const { tbl, stat, pgh, reason, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-ads: الإعلانات ===================== */
// #admin #ads #sponsored
// #page-ads #route #admin #ads
pages.ads = async el => {
  let tab = 'pending';
  const draw = async () => {
    el.innerHTML = pgh('الإعلانات', 'مراجعة إعلانات المتاجر ومتابعة أدائها') + skel(240);
    const { data, error } = await sb.from('kt_ads').select('*, product:kt_products(name,image), store:kt_stores(name), campaign:kt_campaigns(name)').order('created_at', { ascending: false }).limit(200); if (error) throw error;
    const list = tab === 'pending' ? data.filter(a => a.status === 'pending') : data.filter(a => a.status !== 'pending');
    el.innerHTML = pgh('الإعلانات', 'مراجعة إعلانات المتاجر ومتابعة أدائها') + `<div class="grid g3" style="margin-bottom:16px">${stat('target', 'إعلانات نشطة', data.filter(a => a.status === 'active').length)}${stat('trend', 'النقرات', fmt(sum(data, a => a.clicks)), `${fmt(sum(data, a => a.impressions))} ظهور`)}${stat('cash', 'إيراد الإعلانات', money(sum(data, a => a.spent)), 'ما أنفقه البائعون')}</div><div class="tabs">${[['pending', `بانتظار المراجعة (${data.filter(a => a.status === 'pending').length})`], ['all', 'كل الإعلانات']].map(([k, t]) => `<button data-t="${k}" aria-current="${tab === k}">${t}</button>`).join('')}</div>` +
      tbl(['الإعلان', 'المتجر', 'المكان', 'سعر النقرة', 'الميزانية', 'ظهور / نقرات', 'الحالة', ''], list.map(a => `<tr><td><div class="thumb"><img src="${esc(a.product?.image || '')}" alt=""><div><b>${esc(a.product?.name || '-')}</b><span class="sub">${esc(a.campaign?.name || '')}</span></div></div></td><td>${esc(a.store?.name || '-')}</td><td>${PLACE[a.placement]}</td><td>${moneyT(a.cpc)}</td><td>${moneyT(a.spent)} / ${moneyT(a.budget)}</td><td>${fmt(a.impressions)} / ${fmt(a.clicks)}</td><td>${sBadge(AD, a.status)}</td><td class="act">${a.status === 'pending' ? `<button class="btn btn-ok btn-sm" data-a="${a.id}">اعتماد</button> <button class="btn btn-d btn-sm" data-r="${a.id}">رفض</button>` : a.status === 'active' ? `<button class="btn btn-g btn-sm" data-p="${a.id}">إيقاف</button>` : ''}</td></tr>`), empty('target', 'لا إعلانات هنا'));
    $$('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    const upd = async (id, row, msg) => { const { error: e } = await sb.from('kt_ads').update(row).eq('id', id); toast(e ? 'تعذر التنفيذ' : msg, e ? 'err' : ''); if (!e) { draw(); window.Panel.refresh(); } };
    $$('[data-a]').forEach(b => b.onclick = () => upd(b.dataset.a, { status: 'active', reject_reason: null }, 'تم اعتماد الإعلان'));
    $$('[data-p]').forEach(b => b.onclick = () => upd(b.dataset.p, { status: 'paused' }, 'تم إيقاف الإعلان'));
    $$('[data-r]').forEach(b => b.onclick = async () => { const r = await reason('رفض الإعلان'); if (r) upd(b.dataset.r, { status: 'rejected', reject_reason: r }, 'تم رفض الإعلان'); });
  };
  await draw();
};
})();
