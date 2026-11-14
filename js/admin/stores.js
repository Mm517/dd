/* =====================================================================
 * js/admin/stores.js
 * الوظيفة: المتاجر وطلبات البائعين: كروت المتاجر بإحصائياتها وإدارة المتجر (manage).
 * يعتمد على: js/admin/shared.js [BASE, field, pgh, live, reason, pages] · js/admin/orders.js [waNum] · window.Panel [sb, $, $$, esc, fmt, moneyT, date, ic, toast, modal, empty, sBadge, STORE, sum, loadSales]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, $$, esc, fmt, moneyT, date, ic, toast, modal, empty, sBadge, STORE, sum, loadSales } = window.Panel;
const { BASE, field, pgh, live, reason, pages } = NS;   // js/admin/shared.js
const { waNum } = NS;   // js/admin/orders.js

/* ===================== #admin-stores: كروت المتاجر وطلبات البائعين ===================== */
// #admin #stores #seller-request #manage
const statCache = {}; let salesP = null;
const PAYM = { instapay: 'إنستا باي', wallet: 'محفظة', bank: 'بنكي' };
function storeCard(s, requests) {
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${v}</dd>` : '';
  return `<article class="card scard" data-sid="${s.id}"><div class="scard__cover" ${s.cover ? `style="background-image:url('${esc(s.cover)}')"` : ''}>${sBadge(STORE, s.status)}</div>
  <div class="scard__logo">${s.logo ? `<img src="${esc(s.logo)}" alt="" loading="lazy">` : ic('store', 'lg')}</div>
  <div class="scard__body"><div><h3>${esc(s.name)}</h3><a class="sub" dir="ltr" style="text-align:start" href="/store/${esc(s.slug)}" target="_blank" rel="noopener">/store/${esc(s.slug)}</a></div>
  ${s.description ? `<p class="scard__desc">${esc(s.description)}</p>` : ''}
  <dl class="kv">${row('النشاط', esc(s.business_type || ''))}${row('المحافظة', esc(s.city || ''))}${row('الموبايل', s.phone ? `<a dir="ltr" href="tel:${esc(s.phone)}">${esc(s.phone)}</a>` : '')}${row('واتساب', s.whatsapp ? `<a dir="ltr" target="_blank" rel="noopener" href="https://wa.me/${waNum(s.whatsapp)}">${esc(s.whatsapp)}</a>` : '')}${row('الاستلام', s.payout_account ? `${PAYM[s.payout_method] || esc(s.payout_method || '')} <span dir="ltr">${esc(s.payout_account)}</span>` : '')}${row('العمولة', `${s.commission_rate}%`)}${row('رصيد إعلاني', s.ad_credit > 0 ? moneyT(s.ad_credit) : '')}${row('انضم', date(s.created_at))}${row('تمت مراجعته', s.reviewed_at ? date(s.reviewed_at) : '')}${row('إشعارات', `طلبات: ${s.notify_orders ? 'نعم' : 'لا'} • تسويق: ${s.notify_marketing ? 'نعم' : 'لا'}`)}</dl>
  ${s.reject_reason ? `<p style="color:var(--red);font-size:.88rem">${s.status === 'suspended' ? 'سبب الإيقاف' : 'سبب الرفض'}: ${esc(s.reject_reason)}</p>` : ''}
  <div class="scard__stats" data-stats="${s.id}"><div><b>…</b>منتجات</div><div><b>…</b>طلبات</div><div><b>…</b>مبيعات</div></div><div class="scard__imgs" data-imgs="${s.id}"></div>
  <div class="scard__act">${requests ? `<button class="btn btn-ok" data-a="${s.id}">${ic('check', 'sm')} اعتماد</button>${s.status === 'pending' ? `<button class="btn btn-d" data-r="${s.id}">رفض</button>` : ''}` : `<button class="btn btn-p btn-sm" data-s="${s.id}">إدارة</button>`}<a class="btn btn-g btn-sm" href="/store/${esc(s.slug)}" target="_blank" rel="noopener">صفحة المتجر</a></div></div></article>`;
}
async function fillStoreStats(host, rows) {
  const ids = rows.map(s => s.id);
  try {
    const { data: pr } = await sb.from('kt_products').select('id,store_id,image').in('store_id', ids).order('created_at', { ascending: false }).limit(1000);
    ids.forEach(id => { const l = (pr || []).filter(p => p.store_id === id); (statCache[id] ||= {}).prods = l.length; const im = $(`[data-imgs="${id}"]`, host); if (im) im.innerHTML = l.slice(0, 6).map(p => `<img src="${esc(p.image)}" alt="" loading="lazy">`).join(''); });
  } catch (e) { /* الإحصائيات اختيارية */ }
  try {
    const lines = await (salesP ||= loadSales(null));
    ids.forEach(id => { const l = live(lines).filter(x => x.store_id === id); Object.assign(statCache[id] ||= {}, { sales: sum(l, x => x.total), orders: new Set(l.map(x => x.order_id)).size }); });
  } catch (e) { salesP = null; }
  ids.forEach(id => { const st = statCache[id] || {}, box = $(`[data-stats="${id}"]`, host); if (box) box.innerHTML = `<div><b>${st.prods ?? '-'}</b>منتجات</div><div><b>${st.orders ?? '-'}</b>طلبات</div><div><b>${st.sales != null ? fmt(st.sales) : '-'}</b>مبيعات (ج)</div>`; });
}
function storeList(el, { requests = false, tab = 'pending' } = {}) {
  let f = 'all', q = '', rowsById = new Map(); salesP = null;
  const tools = requests ? '' : `<div class="tools"><div class="chips">${[['all', 'الكل'], ['approved', 'مفعّل'], ['suspended', 'موقوف'], ['rejected', 'مرفوض']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث باسم المتجر أو الموبايل"></div>`;
  el.innerHTML = requests ? pgh('طلبات البائعين', 'راجع بيانات المتجر ثم اعتمد أو ارفض') + `<div class="tabs">${[['pending', 'قيد المراجعة'], ['rejected', 'المرفوضة']].map(([k, t]) => `<button data-t="${k}" aria-current="${tab === k}">${t}</button>`).join('')}</div><div id="list"></div>`
    : pgh('المتاجر', '<span id="tot">...</span>', `<a class="btn btn-g" data-l href="${BASE}/seller-request">طلبات الانضمام</a>`) + tools + '<div id="list"></div>';
  const P = window.Panel.pager($('#list', el), {
    size: 9, emptyHtml: empty(requests ? 'check' : 'store', requests ? (tab === 'pending' ? 'لا طلبات جديدة' : 'لا طلبات مرفوضة') : 'لا متاجر'), onTotal: n => { const t = $('#tot', el); if (t) t.textContent = `${fmt(n)} متجر`; },
    fetchPage: async (off, n) => {
      let r = sb.from('kt_stores').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(off, off + n - 1);
      if (requests) r = r.eq('status', tab); else { r = r.neq('status', 'pending'); if (f !== 'all') r = r.eq('status', f); if (q) r = r.or(`name.ilike.%${q}%,phone.ilike.%${q}%`); }
      const { data, error, count: total } = await r; if (error) throw error; return { rows: data || [], total };
    },
    renderRows: (rows, first, host) => {
      if (first) { rowsById.clear(); host.className = 'stores-grid'; }
      rows.forEach(s => rowsById.set(s.id, s)); host.insertAdjacentHTML('beforeend', rows.map(s => storeCard(s, requests)).join('')); fillStoreStats(host, rows);
    }
  });
  const upd = async (id, row, msg) => { const { error: e } = await sb.from('kt_stores').update({ reviewed_at: new Date().toISOString(), ...row }).eq('id', id); toast(e ? 'تعذر التنفيذ' : msg, e ? 'err' : ''); if (!e) { $(`[data-sid="${id}"]`, el)?.remove(); window.Panel.refreshBadges(); } };
  el.onclick = async e => {
    const t = e.target.closest('[data-t],[data-f],[data-a],[data-r],[data-s]'); if (!t) return;
    if (t.dataset.t) { tab = t.dataset.t; return storeList(el, { requests, tab }); }
    if (t.dataset.f) { f = t.dataset.f; $$('[data-f]', el).forEach(x => x.setAttribute('aria-pressed', x === t)); return P.reload(); }
    if (t.dataset.a) return upd(t.dataset.a, { status: 'approved', reject_reason: null }, 'تم اعتماد المتجر');
    if (t.dataset.r) { const r = await reason('رفض طلب المتجر'); if (r) upd(t.dataset.r, { status: 'rejected', reject_reason: r }, 'تم رفض الطلب'); return; }
    if (t.dataset.s) manage(rowsById.get(t.dataset.s), () => P.reload());
  };
  const qi = $('#q', el); if (qi) qi.oninput = window.Panel.debounce(e => { q = window.Panel.qClean(e.target.value); P.reload(); });
}
// #page-stores #route #admin #stores
pages.stores = el => storeList(el);
// #page-seller-request #route #admin #stores
pages['seller-request'] = el => storeList(el, { requests: true });
function manage(s, done) {
  const x = statCache[s.id] || {}, d = modal(`<form id="mf" novalidate><h2>${esc(s.name)} ${sBadge(STORE, s.status)}</h2><dl class="kv"><dt>الرابط</dt><dd dir="ltr" style="text-align:start">/store/${esc(s.slug)}</dd><dt>الموبايل</dt><dd dir="ltr" style="text-align:start">${esc(s.phone || '-')}</dd><dt>المحافظة</dt><dd>${esc(s.city || '-')}</dd><dt>النشاط</dt><dd>${esc(s.business_type || '-')}</dd><dt>انضم</dt><dd>${date(s.created_at)}</dd><dt>الاستلام</dt><dd dir="ltr" style="text-align:start">${esc(s.payout_account || '-')}</dd><dt>المبيعات</dt><dd>${moneyT(x.sales || 0)} من ${x.orders || 0} طلب</dd></dl>
  <div class="fgrid two">${field('cr', 'نسبة العمولة %', `type="number" min="0" max="60" step="0.5" value="${s.commission_rate}"`)}${field('ac', 'رصيد إعلاني مُهدى (جنيه)', `type="number" min="0" step="1" value="${s.ad_credit}"`)}</div>
  <div><label class="lbl" for="mr">ملاحظة / سبب (يظهر للبائع عند الإيقاف)</label><textarea class="field" id="mr" rows="2">${esc(s.reject_reason || '')}</textarea></div><p id="err" class="alert" hidden></p>
  <div class="dlg__foot"><button type="button" class="btn btn-g" id="mx">إغلاق</button>${s.status === 'approved' ? '<button type="button" class="btn btn-d" id="sp">إيقاف المتجر</button>' : '<button type="button" class="btn btn-ok" id="ap">تفعيل المتجر</button>'}<button class="btn btn-p">حفظ</button></div></form>`);
  $('#mx', d).onclick = () => d.close();
  const save = async (extra = {}) => { const err = $('#err', d), cr = +$('#cr', d).value, ac = +$('#ac', d).value; if (!(cr >= 0 && cr <= 60) || !(ac >= 0)) { err.textContent = 'تأكد من القيم'; err.hidden = false; return; } const { error: e } = await sb.from('kt_stores').update({ commission_rate: cr, ad_credit: ac, reject_reason: $('#mr', d).value.trim() || null, ...extra }).eq('id', s.id); if (e) { err.textContent = 'تعذر الحفظ'; err.hidden = false; return; } d.close(); toast('تم الحفظ'); done(); };
  $('#mf', d).onsubmit = e => { e.preventDefault(); save(); };
  $('#sp', d)?.addEventListener('click', () => save({ status: 'suspended' })); $('#ap', d)?.addEventListener('click', () => save({ status: 'approved', reviewed_at: new Date().toISOString(), reject_reason: null }));
}
})();
