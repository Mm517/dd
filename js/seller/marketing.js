/* =====================================================================
 * js/seller/marketing.js
 * الوظيفة: التسويق: الحملات والإعلانات المموّلة.
 * يعتمد على: js/seller/shared.js [BASE, field, sel, tbl, balance, stat, pgh, pages] · window.Panel [sb, $, $$, esc, fmt, money, moneyT, date, ic, toast, modal, ask, empty, badge, sBadge, AD, PLACE, GOAL, sum]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, $, $$, esc, fmt, money, moneyT, date, ic, toast, modal, ask, empty, badge, sBadge, AD, PLACE, GOAL, sum } = window.Panel;
const { BASE, field, sel, tbl, balance, stat, pgh, pages } = NS;   // js/seller/shared.js

/* ===================== #seller-campaigns: الحملات ===================== */
// #seller #campaigns #marketing
// #page-campaigns #route #seller #campaigns
pages.campaigns = async (el, c) => {
  const [{ data: camps, error }, { data: ads }, bal] = await Promise.all([sb.from('kt_campaigns').select('*').eq('store_id', c.store.id).order('created_at', { ascending: false }), sb.from('kt_ads').select('campaign_id,spent,clicks,impressions,status').eq('store_id', c.store.id), balance(c.store.id)]);
  if (error) throw error;
  const agg = id => { const a = (ads || []).filter(x => x.campaign_id === id); return { n: a.length, spent: sum(a, x => x.spent), clicks: sum(a, x => x.clicks), imp: sum(a, x => x.impressions) }; };
  el.innerHTML = pgh('الحملات', 'نظّم إعلاناتك داخل حملات بهدف وفترة زمنية', `<a class="btn btn-g" data-l href="${BASE}/dashboard/campings/ads">إعلاناتي</a> <button class="btn btn-p" id="nc">${ic('plus', 'sm')} حملة جديدة</button>`) +
    `<div class="grid g3" style="margin-bottom:16px">${stat('wallet', 'الرصيد المتاح للإعلانات', money(bal.available), 'الإنفاق على الإعلانات يُخصم من أرباحك أو رصيدك الإعلاني')}${stat('mega', 'عدد الحملات', (camps || []).length, `${(camps || []).filter(x => x.status === 'active').length} نشطة`)}${stat('cash', 'إجمالي الإنفاق', money(sum(ads || [], x => x.spent)), `${fmt(sum(ads || [], x => x.clicks))} نقرة`)}</div>` +
    tbl(['الحملة', 'الهدف', 'الفترة', 'الإعلانات', 'ظهور', 'نقرات', 'الإنفاق', 'الحالة', ''], (camps || []).map(x => { const a = agg(x.id); return `<tr><td><b>${esc(x.name)}</b></td><td>${GOAL[x.goal]}</td><td>${x.starts_at ? date(x.starts_at) : 'من الآن'}<span class="sub">${x.ends_at ? 'حتى ' + date(x.ends_at) : 'بدون نهاية'}</span></td><td>${a.n}</td><td>${fmt(a.imp)}</td><td>${fmt(a.clicks)}</td><td>${money(a.spent)}</td><td>${badge(x.status === 'active' ? 'b-ok' : x.status === 'paused' ? 'b-warn' : '', { active: 'نشطة', paused: 'متوقفة', ended: 'منتهية' }[x.status])}</td><td class="act">${x.status !== 'ended' ? `<button class="btn btn-g btn-sm" data-t="${x.id}" data-s="${x.status === 'active' ? 'paused' : 'active'}">${x.status === 'active' ? 'إيقاف' : 'تشغيل'}</button> ` : ''}<button class="btn btn-d btn-sm" data-d="${x.id}">حذف</button></td></tr>`; }), empty('mega', 'لا توجد حملات بعد', 'أنشئ حملة ثم أضف لها إعلانات لمنتجاتك.', '<button class="btn btn-p" id="nc2">إنشاء حملة</button>'));
  const create = () => {
    const d = modal(`<form id="cf" novalidate><h2>حملة جديدة</h2>${field('cn', 'اسم الحملة', 'maxlength="80" placeholder="مثال: عروض نهاية الأسبوع"')}${sel('cg', 'الهدف', Object.entries(GOAL), 'sales')}<div class="fgrid two">${field('cs', 'تبدأ في', 'type="date"')}${field('ce', 'تنتهي في (اختياري)', 'type="date"')}</div><p id="err" class="alert" hidden></p><div class="dlg__foot"><button type="button" class="btn btn-g" id="cc">إلغاء</button><button class="btn btn-p">إنشاء</button></div></form>`);
    $('#cc', d).onclick = () => d.close();
    $('#cf', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), row = { store_id: c.store.id, name: $('#cn', d).value.trim(), goal: $('#cg', d).value, starts_at: $('#cs', d).value || null, ends_at: $('#ce', d).value || null }; if (row.name.length < 2) { err.textContent = 'اكتب اسم الحملة'; err.hidden = false; return; } if (row.starts_at && row.ends_at && row.ends_at < row.starts_at) { err.textContent = 'تاريخ النهاية قبل البداية'; err.hidden = false; return; } const { error: er } = await sb.from('kt_campaigns').insert(row); if (er) { err.textContent = 'تعذر إنشاء الحملة'; err.hidden = false; return; } d.close(); toast('تم إنشاء الحملة'); pages.campaigns(el, c); };
  };
  $('#nc').onclick = create; $('#nc2')?.addEventListener('click', create);
  $$('[data-t]').forEach(b => b.onclick = async () => { const { error: e } = await sb.from('kt_campaigns').update({ status: b.dataset.s }).eq('id', b.dataset.t); toast(e ? 'تعذر التحديث' : 'تم التحديث', e ? 'err' : ''); pages.campaigns(el, c); });
  $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف الحملة وكل إعلاناتها؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_campaigns').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف' : 'تم الحذف', e ? 'err' : ''); pages.campaigns(el, c); });
};

/* ===================== #seller-ads: الإعلانات ===================== */
// #seller #ads #sponsored
// #page-ads #route #seller #campaigns
pages.ads = async (el, c) => {
  const [{ data: ads, error }, { data: camps }, { data: prods }, bal] = await Promise.all([sb.from('kt_ads').select('*, product:kt_products(name,image), campaign:kt_campaigns(name)').eq('store_id', c.store.id).order('created_at', { ascending: false }), sb.from('kt_campaigns').select('id,name').eq('store_id', c.store.id).eq('status', 'active'), sb.from('kt_products').select('id,name').eq('store_id', c.store.id).eq('approval_status', 'approved').eq('active', true), balance(c.store.id)]);
  if (error) throw error;
  const committed = sum((ads || []).filter(a => ['pending', 'active', 'paused'].includes(a.status)), a => a.budget - a.spent), free = Math.max(0, bal.available - committed);
  el.innerHTML = pgh('الإعلانات', 'اعرض منتجاتك في أماكن مميزة بالموقع. بتدفع فقط لما العميل يضغط على الإعلان.', `<a class="btn btn-g" data-l href="${BASE}/dashboard/campings">الحملات</a> <button class="btn btn-p" id="na">${ic('plus', 'sm')} إعلان جديد</button>`) +
    `<div class="grid g3" style="margin-bottom:16px">${stat('wallet', 'متاح لميزانيات جديدة', money(free), `رصيدك ${moneyT(bal.available)} - محجوز ${moneyT(committed)}`)}${stat('eye', 'مرات الظهور', fmt(sum(ads || [], a => a.impressions)))}${stat('trend', 'النقرات', fmt(sum(ads || [], a => a.clicks)), sum(ads || [], a => a.impressions) ? `CTR ${((sum(ads || [], a => a.clicks) / sum(ads || [], a => a.impressions)) * 100).toFixed(1)}%` : '')}</div>` +
    tbl(['الإعلان', 'الحملة', 'المكان', 'سعر النقرة', 'الميزانية', 'ظهور', 'نقرات', 'الحالة', ''], (ads || []).map(a => `<tr><td><div class="thumb"><img src="${esc(a.product?.image || '')}" alt=""><b>${esc(a.product?.name || '-')}</b></div></td><td>${esc(a.campaign?.name || '-')}</td><td>${PLACE[a.placement]}</td><td>${moneyT(a.cpc)}</td><td style="min-width:130px">${moneyT(a.spent)} / ${moneyT(a.budget)}<div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, (a.spent / a.budget) * 100)}%"></i></div></td><td>${fmt(a.impressions)}</td><td>${fmt(a.clicks)}${a.impressions ? `<span class="sub">${((a.clicks / a.impressions) * 100).toFixed(1)}%</span>` : ''}</td><td>${sBadge(AD, a.status)}${a.status === 'rejected' && a.reject_reason ? `<span class="sub" style="color:var(--red)">${esc(a.reject_reason)}</span>` : ''}</td><td class="act">${['active', 'paused'].includes(a.status) ? `<button class="btn btn-g btn-sm" data-t="${a.id}" data-s="${a.status === 'active' ? 'paused' : 'active'}">${a.status === 'active' ? 'إيقاف' : 'تشغيل'}</button> ` : ''}${['pending', 'rejected', 'paused'].includes(a.status) ? `<button class="btn btn-d btn-sm" data-d="${a.id}">حذف</button>` : ''}</td></tr>`), empty('target', 'لا توجد إعلانات', 'أنشئ إعلانًا لمنتج معتمد وسيراجعه الفريق قبل التشغيل.'));
  $('#na').onclick = () => {
    if (!(camps || []).length) { modal(`<div class="dlg"><h2>أنشئ حملة أولًا</h2><p>الإعلانات بتتجمع داخل حملات. أنشئ حملة نشطة ثم ارجع هنا.</p><div class="dlg__foot"><a class="btn btn-p" data-l href="${BASE}/dashboard/campings" onclick="this.closest('dialog').close()">إنشاء حملة</a></div></div>`); return; }
    if (!(prods || []).length) { toast('لازم يكون عندك منتج معتمد وظاهر أولًا', 'err'); return; }
    const d = modal(`<form id="af" novalidate><h2>إعلان جديد</h2>${sel('ac', 'الحملة', (camps).map(x => [x.id, x.name]))}${sel('ap', 'المنتج', prods.map(x => [x.id, x.name]))}${sel('al', 'مكان الظهور', Object.entries(PLACE), 'home')}<div class="fgrid two">${field('ak', 'سعر النقرة (جنيه)', 'type="number" min="0.5" step="0.25" value="1"', 'الحد الأدنى 0.5 جنيه')}${field('ab', 'الميزانية (جنيه)', `type="number" min="10" step="1" value="${Math.min(100, Math.floor(free)) || 10}"`, `المتاح: ${moneyT(free)}`)}</div><p id="err" class="alert" hidden></p><p class="hint">الإعلان يظهر بعد موافقة Kitchenly، ويتوقف تلقائيًا عند نفاد الميزانية.</p><div class="dlg__foot"><button type="button" class="btn btn-g" id="ax">إلغاء</button><button class="btn btn-p">إرسال للمراجعة</button></div></form>`);
    $('#ax', d).onclick = () => d.close();
    $('#af', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), row = { store_id: c.store.id, campaign_id: $('#ac', d).value, product_id: $('#ap', d).value, placement: $('#al', d).value, cpc: +$('#ak', d).value, budget: +$('#ab', d).value }; if (!(row.cpc >= 0.5)) { err.textContent = 'سعر النقرة 0.5 جنيه على الأقل'; err.hidden = false; return; } if (!(row.budget >= 10)) { err.textContent = 'الميزانية 10 جنيه على الأقل'; err.hidden = false; return; } if (row.budget > free) { err.textContent = 'الميزانية أكبر من الرصيد المتاح'; err.hidden = false; return; } const { error: er } = await sb.from('kt_ads').insert(row); if (er) { err.textContent = /insufficient/.test(er.message) ? 'الرصيد غير كافٍ لهذه الميزانية' : 'تعذر إنشاء الإعلان'; err.hidden = false; return; } d.close(); toast('تم إرسال الإعلان للمراجعة'); pages.ads(el, c); };
  };
  $$('[data-t]').forEach(b => b.onclick = async () => { const { error: e } = await sb.from('kt_ads').update({ status: b.dataset.s }).eq('id', b.dataset.t); toast(e ? 'تعذر التحديث' : 'تم التحديث', e ? 'err' : ''); pages.ads(el, c); });
  $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف الإعلان؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_ads').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف' : 'تم الحذف', e ? 'err' : ''); pages.ads(el, c); });
};
})();
