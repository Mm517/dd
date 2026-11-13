/* Kitchenly - لوحة الأدمن: /admin/... (صفحة كاملة مستقلة عن الموقع). الصلاحية: kt_is_admin() + RLS */
(() => {
'use strict';
const { sb, $, $$, esc, fmt, money, moneyT, date, dt, ic, toast, modal, ask, skel, empty, errBox, badge, orderBadge, sBadge, STORE, PROD, AD, PLACE, ORDER, areaChart, barChart, hbars, lastDays, dkey, sum, csv, loadSales, groupOrders, productForm, SLUG } = window.Panel;
const BASE = '/admin';
const field = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
const tbl = (head, rows, empt) => rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empt;
const stat = (icon, label, val, d = '', cls = '') => `<div class="card stat ${cls}"><div class="stat__l">${ic(icon)}${label}</div><div class="stat__v">${val}</div>${d ? `<div class="stat__d">${d}</div>` : ''}</div>`;
const pgh = (t, s, act = '') => `<div class="pgh"><div><h2>${t}</h2>${s ? `<p>${s}</p>` : ''}</div><div>${act}</div></div>`;
const live = l => l.filter(x => x.status !== 'cancelled');
const KIT = 'Kitchenly (منتجاتنا)';
const reason = (title, ok = 'رفض', ph = 'اكتب السبب ليظهر للبائع') => new Promise(res => {
  const d = modal(`<form class="dlg" novalidate><h2>${esc(title)}</h2><div><label class="lbl" for="rr">السبب</label><textarea class="field" id="rr" rows="3" maxlength="300" placeholder="${ph}"></textarea></div><div class="dlg__foot"><button type="button" class="btn btn-g" id="rn">إلغاء</button><button class="btn btn-d">${ok}</button></div></form>`);
  let done = false; $('#rn', d).onclick = () => d.close();
  $('form', d).onsubmit = e => { e.preventDefault(); const v = $('#rr', d).value.trim(); if (v.length < 3) { $('#rr', d).focus(); return; } done = true; d.close(); res(v); };
  d.addEventListener('close', () => { if (!done) res(null); });
});
const count = async (table, f) => { let q = sb.from(table).select('id', { count: 'exact', head: true }); q = f(q); const { count: n } = await q; return n || 0; };
const pages = {};

/* ======================= الحماية + الدخول ======================= */
let isAdmin = null;
function loginScreen(msg = '') {
  $('#root').innerHTML = `<div class="auth"><section class="auth__art"><div class="auth__logo"><img src="/assets/img/logo-mark.jpg" alt="">KITCHENLY <span style="font-weight:400;opacity:.7;letter-spacing:0">| الإدارة</span></div><div><h2>لوحة إدارة Kitchenly</h2><ul><li>${ic('users')}<span>مراجعة المتاجر الجديدة والمنتجات</span></li><li>${ic('wallet')}<span>المبيعات والعمولات وتحويلات البائعين</span></li><li>${ic('chart')}<span>تحليلات المتجر والزيارات</span></li></ul></div><p style="opacity:.6;font-size:.85rem">دخول المديرين فقط</p></section>
  <section class="auth__form"><div class="auth__box"><div><h1>دخول الأدمن</h1><p>استخدم حساب المدير المسجّل في kt_admins.</p></div><form id="f" class="fgrid" novalidate>${field('em', 'البريد الإلكتروني', 'type="email" dir="ltr" autocomplete="email"')}${field('pw', 'كلمة المرور', 'type="password" dir="ltr" autocomplete="current-password"')}<p id="err" class="alert" role="alert" ${msg ? '' : 'hidden'}>${esc(msg)}</p><button class="btn btn-p btn-block" id="b">دخول</button></form><p style="text-align:center"><a class="link-b" href="/">العودة للموقع</a></p></div></section></div>`;
  document.title = 'دخول الأدمن | Kitchenly';
  $('#f').onsubmit = async e => { e.preventDefault(); const b = $('#b'), err = $('#err'); err.hidden = true; b.disabled = true; const { error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value }); b.disabled = false; if (error) { err.textContent = 'الإيميل أو كلمة المرور غير صحيحة'; err.hidden = false; return; } window.Panel.refresh(); };
}
async function guard() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { loginScreen(); return null; }
  const { data: ok } = await sb.rpc('kt_is_admin');
  if (ok !== true) {
    $('#root').innerHTML = `<div style="min-height:100vh;display:grid;place-items:center;padding:20px"><div class="card" style="max-width:440px;text-align:center;display:grid;gap:12px;justify-items:center">${ic('lock', 'lg')}<h1 style="font-size:1.4rem">غير مصرح</h1><p style="color:var(--muted)">حساب <b dir="ltr">${esc(session.user.email)}</b> ليس ضمن مديري المتجر.</p><div style="display:flex;gap:8px"><a class="btn btn-p" href="/">العودة للموقع</a><button class="btn btn-g" id="so">تبديل الحساب</button></div></div></div>`;
    $('#so').onclick = async () => { await sb.auth.signOut(); window.Panel.refresh(); }; return null;
  }
  return { user: session.user, name: 'مدير المتجر' };
}
const badges = async () => {
  const [a, b, c, d] = await Promise.all([count('kt_products', q => q.eq('approval_status', 'pending')), count('kt_stores', q => q.eq('status', 'pending')), count('kt_ads', q => q.eq('status', 'pending')), count('kt_payouts', q => q.eq('status', 'pending'))]);
  return { '/product-requests': a, '/seller-request': b, '/ads': c, '/money': d };
};

/* ======================= نظرة عامة ======================= */
pages.overview = async el => {
  el.innerHTML = pgh('نظرة عامة', 'ملخص نشاط المتجر والمتاجر الشريكة') + `<div class="grid g4" id="st">${[1, 2, 3, 4].map(() => skel(110)).join('')}</div><div class="grid g-main" style="margin-top:16px"><div>${skel(300)}</div><div>${skel(300)}</div></div>`;
  const [lines, stores, pq, sq, aq, pr] = await Promise.all([loadSales(null), sb.from('kt_stores').select('*'), count('kt_products', q => q.eq('approval_status', 'pending')), count('kt_stores', q => q.eq('status', 'pending')), count('kt_ads', q => q.eq('status', 'pending')), count('kt_payouts', q => q.eq('status', 'pending'))]);
  const sl = stores.data || [], now = Date.now(), l30 = live(lines).filter(l => now - new Date(l.created_at) < 30 * 864e5), orders = groupOrders(lines), o30 = groupOrders(l30);
  const days = lastDays(14), byDay = Object.fromEntries(days.map(k => [k, 0])); live(lines).forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; });
  const top = Object.values(l30.reduce((m, l) => { (m[l.store_name || KIT] ||= { l: l.store_name || KIT, v: 0 }).v += l.total; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
  const q = [['product-requests', 'box', 'منتجات تنتظر المراجعة', pq], ['seller-request', 'store', 'طلبات بائعين جدد', sq], ['ads', 'target', 'إعلانات تنتظر الموافقة', aq], ['money', 'wallet', 'طلبات سحب', pr]];
  const stats = stat('cash', 'إجمالي المبيعات (30 يوم)', money(sum(l30, l => l.total)), `${o30.length} طلب`, 'stat--hl') + stat('bag', 'كل الطلبات', orders.length, `${orders.filter(o => ['new', 'confirmed'].includes(o.status)).length} تنتظر المعالجة`) + stat('store', 'المتاجر الشريكة', sl.filter(s => s.status === 'approved').length, `${sl.length} إجمالي`) + stat('clock', 'بانتظار إجراء منك', pq + sq + aq + pr, 'مراجعات وطلبات سحب');
  el.innerHTML = pgh('نظرة عامة', 'ملخص نشاط المتجر والمتاجر الشريكة') + `<div class="grid g4 keep2">${stats}</div><div class="grid g4 keep2" style="margin-top:16px">${q.map(([h, i, t, n]) => `<a data-l href="${BASE}/${h}" class="card" style="display:flex;gap:12px;align-items:center">${ic(i, 'lg')}<div><b class="num" style="font-size:1.4rem;display:block;line-height:1.2;${n ? 'color:var(--red)' : ''}">${n}</b><span style="color:var(--muted);font-size:.85rem">${t}</span></div></a>`).join('')}</div>
  <div class="grid g-main" style="margin-top:16px"><div class="card"><div class="card__head"><div><h3>المبيعات، آخر 14 يوم</h3><p>كل المتاجر بدون الطلبات الملغية</p></div></div>${areaChart(days, days.map(k => byDay[k]), { unit: 'جنيه' })}</div><div class="card"><div class="card__head"><h3>أعلى المتاجر مبيعًا (30 يوم)</h3></div>${top.length ? hbars(top, moneyT) : '<p class="empty">لا مبيعات بعد</p>'}</div></div>
  <div class="card__head" style="margin-top:22px"><h3>آخر الطلبات</h3><a class="btn-link" data-l href="${BASE}/orders">كل الطلبات</a></div>` +
    tbl(['الطلب', 'التاريخ', 'العميل', 'المتاجر', 'المبلغ', 'الحالة'], orders.slice(0, 6).map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.no)}</b></td><td>${date(o.at)}</td><td>${esc(o.name)}</td><td>${[...o.stores].map(esc).join('، ')}</td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td></tr>`), empty('bag', 'لا طلبات بعد'));
};

/* ======================= الطلبات ======================= */
pages.orders = async el => {
  el.innerHTML = pgh('الطلبات', 'كل طلبات العملاء، وتحديث الحالة') + skel(300);
  const [{ data, error }, lines] = await Promise.all([sb.from('kt_orders').select('*').order('created_at', { ascending: false }).limit(300), loadSales(null).catch(() => [])]);
  if (error) throw error;
  const stMap = {}; lines.forEach(l => (stMap[l.order_id] ||= new Set()).add(l.store_name || 'Kitchenly'));
  let f = 'all', q = '';
  const draw = () => {
    const list = data.filter(o => (f === 'all' || o.status === f) && (!q || `${o.order_no} ${o.customer_name} ${o.phone}`.toLowerCase().includes(q)));
    el.innerHTML = pgh('الطلبات', 'كل طلبات العملاء، وتحديث الحالة', `<button class="btn btn-g" id="ex">${ic('dl', 'sm')} تصدير CSV</button>`) +
      `<div class="tools"><div class="chips">${[['all', 'الكل'], ...Object.entries(ORDER).map(([k, v]) => [k, v[0]])].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t} (${k === 'all' ? data.length : data.filter(o => o.status === k).length})</button>`).join('')}</div><input class="field" id="q" placeholder="رقم الطلب أو العميل أو الموبايل" value="${esc(q)}"></div>` +
      tbl(['الطلب', 'العميل', 'المنتجات', 'المتاجر', 'الدفع', 'الإجمالي', 'الحالة'], list.map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.order_no)}</b><span class="sub">${dt(o.created_at)}</span></td><td>${esc(o.customer_name)}<span class="sub" dir="ltr" style="text-align:start"><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></span><span class="sub">${esc(o.city)} - ${esc(o.address)}</span></td><td>${(o.items || []).map(i => `<span class="sub" style="color:var(--ink)">${esc(i.name)} × ${i.qty}</span>`).join('')}</td><td>${[...(stMap[String(o.id)] || [])].map(esc).join('، ') || '-'}</td><td>${{ cod: 'عند الاستلام', wallet: 'محفظة', online: 'أونلاين', instapay: 'إنستا باي' }[o.payment_method] || esc(o.payment_method)}</td><td>${money(o.total)}</td><td><select class="field" style="min-width:150px" data-status="${o.id}" aria-label="حالة الطلب">${Object.entries(ORDER).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></td></tr>`), empty('bag', 'لا طلبات'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const p = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
    $('#ex').onclick = () => csv('orders.csv', [['رقم الطلب', 'التاريخ', 'العميل', 'الموبايل', 'المحافظة', 'العنوان', 'الدفع', 'الإجمالي', 'الحالة'], ...list.map(o => [o.order_no, dt(o.created_at), o.customer_name, o.phone, o.city, o.address, o.payment_method, o.total, (ORDER[o.status] || [o.status])[0]])]);
    $$('[data-status]').forEach(s => s.onchange = async () => { const { error: e } = await sb.from('kt_orders').update({ status: s.value }).eq('id', s.dataset.status); if (!e) data.find(o => String(o.id) === s.dataset.status).status = s.value; toast(e ? 'تعذر تحديث الحالة' : 'تم تحديث الحالة', e ? 'err' : ''); });
  };
  draw();
};

/* ======================= المنتجات ======================= */
pages.products = async (el, c) => {
  const [{ data: cats }, { data: list, error }, { data: stores }] = await Promise.all([sb.from('kt_categories').select('*').order('sort'), sb.from('kt_products').select('*, category:kt_categories(name)').order('created_at', { ascending: false }), sb.from('kt_stores').select('id,name')]);
  if (error) throw error; const sn = Object.fromEntries((stores || []).map(s => [s.id, s.name])); let f = 'all', q = '';
  const open = p => productForm({ p, cats: cats || [], uid: c.user.id, admin: true, onSaved: () => pages.products(el, c) });
  const draw = () => {
    const rows = list.filter(p => (f === 'all' || (f === 'own' ? !p.store_id : p.store_id)) && (!q || p.name.toLowerCase().includes(q)));
    el.innerHTML = pgh('المنتجات', 'منتجات Kitchenly ومنتجات المتاجر الشريكة', `<button class="btn btn-p" id="np">${ic('plus', 'sm')} منتج جديد</button>`) +
      `<div class="tools"><div class="chips">${[['all', 'الكل'], ['own', 'منتجاتنا'], ['sellers', 'منتجات البائعين']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث باسم المنتج" value="${esc(q)}"></div>` +
      tbl(['المنتج', 'المتجر', 'القسم', 'السعر', 'المخزون', 'الحالة', ''], rows.map(p => `<tr><td><div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"><b>${esc(p.name)}</b></div></td><td>${esc(sn[p.store_id] || 'Kitchenly')}</td><td>${esc(p.category?.name || '-')}</td><td>${money(p.price)}${p.old_price > p.price ? '<span class="sub">عرض</span>' : ''}</td><td>${p.stock}</td><td>${sBadge(PROD, p.approval_status)} ${p.active ? '' : badge('', 'مخفي')}</td><td class="act"><button class="btn btn-g btn-sm" data-e="${p.id}">تعديل</button> <button class="btn btn-d btn-sm" data-d="${p.id}">حذف</button></td></tr>`), empty('box', 'لا منتجات'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const p = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
    $('#np').onclick = () => open(null); $$('[data-e]').forEach(b => b.onclick = () => open(list.find(p => p.id === b.dataset.e)));
    $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف المنتج نهائيًا؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_products').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف' : 'تم الحذف', e ? 'err' : ''); if (!e) pages.products(el, c); });
  };
  draw();
};

/* ======================= طلبات المنتجات (مراجعة) ======================= */
pages['product-requests'] = async el => {
  let tab = 'pending';
  const draw = async () => {
    el.innerHTML = pgh('طلبات المنتجات', 'راجع منتجات البائعين قبل ظهورها في الموقع') + skel(260);
    const [{ data, error }, { data: stores }] = await Promise.all([sb.from('kt_products').select('*, category:kt_categories(name)').not('store_id', 'is', null).eq('approval_status', tab === 'pending' ? 'pending' : tab).order('created_at', { ascending: false }).limit(100), sb.from('kt_stores').select('id,name')]);
    if (error) throw error; const sn = Object.fromEntries((stores || []).map(s => [s.id, s.name]));
    el.innerHTML = pgh('طلبات المنتجات', 'راجع منتجات البائعين قبل ظهورها في الموقع') + `<div class="tabs">${[['pending', 'قيد المراجعة'], ['approved', 'المعتمدة'], ['rejected', 'المرفوضة']].map(([k, t]) => `<button data-t="${k}" aria-current="${tab === k}">${t}</button>`).join('')}</div>` +
      (data.length ? `<div class="grid">${data.map(p => `<article class="card pcard-r"><img src="${esc(p.image)}" alt=""><div><h3>${esc(p.name)} ${sBadge(PROD, p.approval_status)}</h3><p>${esc(sn[p.store_id] || '-')} • ${esc(p.category?.name || '-')} • ${moneyT(p.price)}${p.old_price > p.price ? ` <s>${moneyT(p.old_price)}</s>` : ''} • مخزون ${p.stock}</p><p style="margin-top:4px">${esc((p.description || '').slice(0, 160))}${(p.description || '').length > 160 ? '...' : ''}</p>${p.reject_reason ? `<p style="color:var(--red)">سبب الرفض: ${esc(p.reject_reason)}</p>` : ''}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g btn-sm" data-v="${p.id}">تفاصيل</button>${p.approval_status !== 'approved' ? `<button class="btn btn-ok btn-sm" data-a="${p.id}">اعتماد</button>` : ''}${p.approval_status !== 'rejected' ? `<button class="btn btn-d btn-sm" data-r="${p.id}">رفض</button>` : ''}</div></article>`).join('')}</div>` : empty('check', tab === 'pending' ? 'لا منتجات بانتظار المراجعة' : 'لا نتائج'));
    $$('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    const upd = async (id, row, msg) => { const { error: e } = await sb.from('kt_products').update(row).eq('id', id); toast(e ? 'تعذر التنفيذ' : msg, e ? 'err' : ''); if (!e) { draw(); window.Panel.refresh(); } };
    $$('[data-a]').forEach(b => b.onclick = () => upd(b.dataset.a, { approval_status: 'approved', reject_reason: null }, 'تم اعتماد المنتج'));
    $$('[data-r]').forEach(b => b.onclick = async () => { const r = await reason('رفض المنتج'); if (r) upd(b.dataset.r, { approval_status: 'rejected', reject_reason: r }, 'تم رفض المنتج'); });
    $$('[data-v]').forEach(b => b.onclick = () => { const p = data.find(x => x.id === b.dataset.v); modal(`<div class="dlg"><h2>${esc(p.name)}</h2><div class="upl"><img src="${esc(p.image)}" alt="" style="width:120px;height:120px"><dl class="kv"><dt>المتجر</dt><dd>${esc(sn[p.store_id] || '-')}</dd><dt>القسم</dt><dd>${esc(p.category?.name || '-')}</dd><dt>السعر</dt><dd>${moneyT(p.price)}</dd><dt>المخزون</dt><dd>${p.stock}</dd></dl></div><p>${esc(p.short_desc || '')}</p><p style="white-space:pre-wrap">${esc(p.description || '')}</p>${(p.features || []).length ? `<ul class="rows">${p.features.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${(p.images || []).length > 1 ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${p.images.map(i => `<img src="${esc(i)}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:10px">`).join('')}</div>` : ''}<div class="dlg__foot"><button class="btn btn-g" onclick="this.closest('dialog').close()">إغلاق</button></div></div>`); });
  };
  await draw();
};

/* ======================= المتاجر ======================= */
pages.stores = async el => {
  el.innerHTML = pgh('المتاجر', 'كل المتاجر الشريكة') + skel(260);
  const [{ data: stores, error }, { data: prods }, lines] = await Promise.all([sb.from('kt_stores').select('*').order('created_at', { ascending: false }), sb.from('kt_products').select('id,store_id'), loadSales(null)]);
  if (error) throw error; let f = 'all', q = '';
  const stat_ = id => { const l = live(lines).filter(x => x.store_id === id); return { sales: sum(l, x => x.total), orders: new Set(l.map(x => x.order_id)).size, prods: (prods || []).filter(p => p.store_id === id).length }; };
  const draw = () => {
    const rows = stores.filter(s => s.status !== 'pending' && (f === 'all' || s.status === f) && (!q || `${s.name} ${s.phone}`.toLowerCase().includes(q)));
    el.innerHTML = pgh('المتاجر', 'المتاجر الشريكة المعتمدة والموقوفة والمرفوضة', `<a class="btn btn-g" data-l href="${BASE}/seller-request">طلبات الانضمام</a>`) +
      `<div class="tools"><div class="chips">${[['all', 'الكل'], ['approved', 'مفعّل'], ['suspended', 'موقوف'], ['rejected', 'مرفوض']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث باسم المتجر أو الموبايل" value="${esc(q)}"></div>` +
      tbl(['المتجر', 'التواصل', 'المنتجات', 'الطلبات', 'المبيعات', 'العمولة', 'الحالة', ''], rows.map(s => { const x = stat_(s.id); return `<tr><td><div class="thumb">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : `<span class="thumb-i" style="display:grid;place-items:center;color:var(--brand)">${ic('store')}</span>`}<div><b>${esc(s.name)}</b><span class="sub" dir="ltr" style="text-align:start">/store/${esc(s.slug)}</span></div></div></td><td><span dir="ltr" style="display:block;text-align:start">${esc(s.phone || '-')}</span><span class="sub">${esc(s.city || '')}</span></td><td>${x.prods}</td><td>${x.orders}</td><td>${money(x.sales)}</td><td>${s.commission_rate}%</td><td>${sBadge(STORE, s.status)}</td><td class="act"><button class="btn btn-g btn-sm" data-s="${s.id}">إدارة</button></td></tr>`; }), empty('store', 'لا متاجر'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const p = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
    $$('[data-s]').forEach(b => b.onclick = () => manage(stores.find(s => s.id === b.dataset.s)));
  };
  const manage = s => {
    const x = stat_(s.id), d = modal(`<form id="mf" novalidate><h2>${esc(s.name)} ${sBadge(STORE, s.status)}</h2><dl class="kv"><dt>الرابط</dt><dd dir="ltr" style="text-align:start">/store/${esc(s.slug)}</dd><dt>الموبايل</dt><dd dir="ltr" style="text-align:start">${esc(s.phone || '-')}</dd><dt>المحافظة</dt><dd>${esc(s.city || '-')}</dd><dt>النشاط</dt><dd>${esc(s.business_type || '-')}</dd><dt>انضم</dt><dd>${date(s.created_at)}</dd><dt>الاستلام</dt><dd dir="ltr" style="text-align:start">${esc(s.payout_account || '-')}</dd><dt>المبيعات</dt><dd>${moneyT(x.sales)} من ${x.orders} طلب</dd></dl>
    <div class="fgrid two">${field('cr', 'نسبة العمولة %', `type="number" min="0" max="60" step="0.5" value="${s.commission_rate}"`)}${field('ac', 'رصيد إعلاني مُهدى (جنيه)', `type="number" min="0" step="1" value="${s.ad_credit}"`)}</div>
    <div><label class="lbl" for="mr">ملاحظة / سبب (يظهر للبائع عند الإيقاف)</label><textarea class="field" id="mr" rows="2">${esc(s.reject_reason || '')}</textarea></div><p id="err" class="alert" hidden></p>
    <div class="dlg__foot"><button type="button" class="btn btn-g" id="mx">إغلاق</button>${s.status === 'approved' ? '<button type="button" class="btn btn-d" id="sp">إيقاف المتجر</button>' : '<button type="button" class="btn btn-ok" id="ap">تفعيل المتجر</button>'}<button class="btn btn-p">حفظ</button></div></form>`);
    $('#mx', d).onclick = () => d.close();
    const save = async (extra = {}) => { const err = $('#err', d), cr = +$('#cr', d).value, ac = +$('#ac', d).value; if (!(cr >= 0 && cr <= 60) || !(ac >= 0)) { err.textContent = 'تأكد من القيم'; err.hidden = false; return; } const { error: e } = await sb.from('kt_stores').update({ commission_rate: cr, ad_credit: ac, reject_reason: $('#mr', d).value.trim() || null, ...extra }).eq('id', s.id); if (e) { err.textContent = 'تعذر الحفظ'; err.hidden = false; return; } d.close(); toast('تم الحفظ'); pages.stores(el); };
    $('#mf', d).onsubmit = e => { e.preventDefault(); save(); };
    $('#sp', d)?.addEventListener('click', () => save({ status: 'suspended' })); $('#ap', d)?.addEventListener('click', () => save({ status: 'approved', reviewed_at: new Date().toISOString(), reject_reason: null }));
  };
  draw();
};

/* ======================= طلبات البائعين ======================= */
pages['seller-request'] = async el => {
  let tab = 'pending';
  const draw = async () => {
    el.innerHTML = pgh('طلبات البائعين', 'طلبات فتح متاجر جديدة') + skel(240);
    const { data, error } = await sb.from('kt_stores').select('*').eq('status', tab).order('created_at', { ascending: false }); if (error) throw error;
    el.innerHTML = pgh('طلبات البائعين', 'راجع بيانات المتجر ثم اعتمد أو ارفض') + `<div class="tabs">${[['pending', 'قيد المراجعة'], ['rejected', 'المرفوضة']].map(([k, t]) => `<button data-t="${k}" aria-current="${tab === k}">${t}</button>`).join('')}</div>` +
      (data.length ? `<div class="grid g2">${data.map(s => `<article class="card" style="display:grid;gap:12px"><div style="display:flex;gap:12px;align-items:center">${s.logo ? `<img class="thumb-i" src="${esc(s.logo)}" alt="" style="width:52px;height:52px">` : `<span class="thumb-i" style="display:grid;place-items:center;width:52px;height:52px;color:var(--brand)">${ic('store', 'lg')}</span>`}<div><h3>${esc(s.name)}</h3><p style="color:var(--muted);font-size:.85rem">تقدّم ${dt(s.created_at)}</p></div></div><dl class="kv"><dt>الموبايل</dt><dd dir="ltr" style="text-align:start"><a href="tel:${esc(s.phone)}">${esc(s.phone || '-')}</a></dd><dt>المحافظة</dt><dd>${esc(s.city || '-')}</dd><dt>النشاط</dt><dd>${esc(s.business_type || '-')}</dd><dt>الرابط</dt><dd dir="ltr" style="text-align:start">/store/${esc(s.slug)}</dd></dl>${s.description ? `<p style="font-size:.9rem;color:var(--muted)">${esc(s.description)}</p>` : ''}${s.reject_reason ? `<p style="color:var(--red);font-size:.88rem">سبب الرفض: ${esc(s.reject_reason)}</p>` : ''}<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ok" data-a="${s.id}">${ic('check', 'sm')} اعتماد</button>${tab === 'pending' ? `<button class="btn btn-d" data-r="${s.id}">رفض</button>` : ''}</div></article>`).join('')}</div>` : empty('check', tab === 'pending' ? 'لا طلبات جديدة' : 'لا طلبات مرفوضة'));
    $$('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    const upd = async (id, row, msg) => { const { error: e } = await sb.from('kt_stores').update({ reviewed_at: new Date().toISOString(), ...row }).eq('id', id); toast(e ? 'تعذر التنفيذ' : msg, e ? 'err' : ''); if (!e) { draw(); window.Panel.refresh(); } };
    $$('[data-a]').forEach(b => b.onclick = () => upd(b.dataset.a, { status: 'approved', reject_reason: null }, 'تم اعتماد المتجر'));
    $$('[data-r]').forEach(b => b.onclick = async () => { const r = await reason('رفض طلب المتجر'); if (r) upd(b.dataset.r, { status: 'rejected', reject_reason: r }, 'تم رفض الطلب'); });
  };
  await draw();
};

/* ======================= الإعلانات ======================= */
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

/* ======================= الأموال ======================= */
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

/* ======================= التحليلات ======================= */
pages.analytics = async el => {
  let range = 30;
  const draw = async () => {
    el.innerHTML = pgh('التحليلات', 'أداء الموقع والمتاجر', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) + skel(400);
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
    const from = new Date(Date.now() - range * 864e5), keys = lastDays(Math.min(range, 60));
    const [all, pv, { data: stores }, { data: ads }] = await Promise.all([loadSales(null), sb.from('kt_product_views').select('day,views').gte('day', dkey(from)), sb.from('kt_stores').select('id,status,created_at'), sb.from('kt_ads').select('impressions,clicks,spent')]);
    const lv = live(all.filter(l => new Date(l.created_at) >= from)), orders = groupOrders(lv), views = sum(pv.data || [], v => v.views), rev = sum(lv, l => l.total);
    const byDay = Object.fromEntries(keys.map(k => [k, 0])), oDay = { ...byDay }; lv.forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; }); orders.forEach(o => { const k = dkey(o.at); if (k in oDay) oDay[k]++; });
    const topStores = Object.values(lv.reduce((m, l) => { (m[l.store_name || KIT] ||= { l: l.store_name || KIT, v: 0 }).v += l.total; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
    const topProd = Object.values(lv.reduce((m, l) => { (m[l.slug] ||= { l: l.product_name, v: 0 }).v += l.qty; return m; }, {})).sort((a, b) => b.v - a.v).slice(0, 6);
    const cities = Object.entries(orders.reduce((m, o) => (m[o.city || 'غير محدد'] = (m[o.city || 'غير محدد'] || 0) + 1, m), {})).map(([l, v]) => ({ l, v })).sort((a, b) => b.v - a.v).slice(0, 6);
    const stt = Object.entries(ORDER).map(([k, v]) => ({ l: v[0], v: groupOrders(all.filter(l => new Date(l.created_at) >= from)).filter(o => o.status === k).length })).filter(x => x.v);
    const newStores = (stores || []).filter(s => new Date(s.created_at) >= from).length, imp = sum(ads || [], a => a.impressions), clk = sum(ads || [], a => a.clicks);
    el.innerHTML = pgh('التحليلات', 'أداء الموقع والمتاجر', `<div class="chips">${[7, 30, 90].map(n => `<button class="chip" data-r="${n}" aria-pressed="${range === n}">آخر ${n} يوم</button>`).join('')}</div>`) +
      `<div class="grid g4 keep2">${stat('cash', 'المبيعات', money(rev), `${orders.length} طلب`)}${stat('bag', 'متوسط الطلب', orders.length ? money(rev / orders.length) : '-')}${stat('eye', 'مشاهدات المنتجات', fmt(views), views ? `تحويل ${((orders.length / views) * 100).toFixed(1)}%` : '')}${stat('store', 'متاجر جديدة', newStores, `${(stores || []).filter(s => s.status === 'approved').length} متجر مفعّل`)}</div>
      <div class="grid g2" style="margin-top:16px"><div class="card"><div class="card__head"><h3>المبيعات اليومية</h3></div>${areaChart(keys, keys.map(k => byDay[k]), { unit: 'جنيه' })}</div><div class="card"><div class="card__head"><h3>عدد الطلبات يوميًا</h3></div>${barChart(keys.slice(-14).map(k => ({ l: k.slice(8), v: oDay[k] })), { color: 'var(--blue)', unit: 'طلب' })}</div>
      <div class="card"><div class="card__head"><h3>أعلى المتاجر مبيعًا</h3></div>${topStores.length ? hbars(topStores, moneyT) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>الأكثر مبيعًا (كمية)</h3></div>${topProd.length ? hbars(topProd) : '<p class="empty">لا بيانات</p>'}</div>
      <div class="card"><div class="card__head"><h3>حالات الطلبات</h3></div>${stt.length ? hbars(stt) : '<p class="empty">لا بيانات</p>'}</div><div class="card"><div class="card__head"><h3>أكثر المحافظات طلبًا</h3></div>${cities.length ? hbars(cities) : '<p class="empty">لا بيانات</p>'}</div></div>
      <div class="card" style="margin-top:16px"><div class="card__head"><h3>أداء الإعلانات (الإجمالي)</h3></div><div class="grid g3"><div><p class="sub">مرات الظهور</p><b class="num" style="font-size:1.4rem">${fmt(imp)}</b></div><div><p class="sub">النقرات</p><b class="num" style="font-size:1.4rem">${fmt(clk)}</b></div><div><p class="sub">CTR</p><b class="num" style="font-size:1.4rem">${imp ? ((clk / imp) * 100).toFixed(2) + '%' : '-'}</b></div></div></div>`;
    $$('[data-r]').forEach(b => b.onclick = () => { range = +b.dataset.r; draw(); });
  };
  await draw();
};

/* ======================= الأقسام ======================= */
pages.categories = async el => {
  const { data, error } = await sb.from('kt_categories').select('*').order('sort'); if (error) throw error;
  el.innerHTML = pgh('الأقسام', 'أقسام المتجر وترتيبها', `<button class="btn btn-p" id="nc">${ic('plus', 'sm')} قسم جديد</button>`) + tbl(['الترتيب', 'الاسم', 'الرابط', ''], data.map(c => `<tr><td>${c.sort ?? ''}</td><td><b>${esc(c.name)}</b></td><td dir="ltr" style="text-align:start">/category/${esc(c.slug)}</td><td class="act"><button class="btn btn-g btn-sm" data-e="${c.id}">تعديل</button> <button class="btn btn-d btn-sm" data-d="${c.id}">حذف</button></td></tr>`), empty('layers', 'لا أقسام'));
  const form = c => {
    const d = modal(`<form id="cf" novalidate><h2>${c ? 'تعديل القسم' : 'قسم جديد'}</h2>${field('cn', 'الاسم', `maxlength="40" value="${esc(c?.name || '')}"`)}${field('cs', 'الرابط (إنجليزي)', `dir="ltr" value="${esc(c?.slug || '')}" ${c ? 'readonly' : ''}`)}${field('co', 'الترتيب', `type="number" value="${c?.sort ?? data.length + 1}"`)}<p id="err" class="alert" hidden></p><div class="dlg__foot"><button type="button" class="btn btn-g" id="cx">إلغاء</button><button class="btn btn-p">حفظ</button></div></form>`);
    $('#cx', d).onclick = () => d.close();
    $('#cf', d).onsubmit = async e => { e.preventDefault(); const err = $('#err', d), row = { name: $('#cn', d).value.trim(), slug: $('#cs', d).value.trim(), sort: +$('#co', d).value || 0 }; if (!row.name) { err.textContent = 'اكتب الاسم'; err.hidden = false; return; } if (!SLUG.test(row.slug)) { err.textContent = 'الرابط حروف إنجليزية صغيرة وأرقام وشرطات'; err.hidden = false; return; } const { error: er } = c ? await sb.from('kt_categories').update(row).eq('id', c.id) : await sb.from('kt_categories').insert(row); if (er) { err.textContent = er.code === '23505' ? 'الرابط مستخدم' : 'تعذر الحفظ'; err.hidden = false; return; } d.close(); toast('تم الحفظ'); pages.categories(el); };
  };
  $('#nc').onclick = () => form(null); $$('[data-e]').forEach(b => b.onclick = () => form(data.find(c => c.id === b.dataset.e)));
  $$('[data-d]').forEach(b => b.onclick = async () => { if (!(await ask('حذف القسم؟ لو عليه منتجات ممكن الحذف يفشل.', 'حذف', true))) return; const { error: e } = await sb.from('kt_categories').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف (القسم عليه منتجات)' : 'تم الحذف', e ? 'err' : ''); if (!e) pages.categories(el); });
};

/* ======================= الرسائل ======================= */
pages.messages = async el => {
  const { data, error } = await sb.from('kt_messages').select('*').order('created_at', { ascending: false }).limit(200); if (error) throw error; let f = 'open';
  const draw = () => {
    const list = data.filter(m => f === 'all' || (f === 'open' ? !m.handled : f === 'sellers' ? /\[(دعم بائع|طلب انضمام)\]/.test(m.body || '') : m.handled));
    el.innerHTML = pgh('الرسائل', 'رسائل العملاء والبائعين') + `<div class="tools"><div class="chips">${[['open', `بدون رد (${data.filter(m => !m.handled).length})`], ['sellers', 'دعم البائعين'], ['done', 'تم الرد'], ['all', 'الكل']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div></div>` +
      (list.length ? `<div class="grid">${list.map(m => `<article class="card"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><b>${esc(m.name)}</b><span style="color:var(--muted);font-size:.85rem">${dt(m.created_at)}</span></div>${m.phone ? `<p dir="ltr" style="text-align:start;font-size:.88rem;color:var(--muted)">${esc(m.phone)}</p>` : ''}<p style="margin-top:8px;white-space:pre-wrap">${esc(m.body)}</p><label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:.9rem"><input type="checkbox" data-h="${m.id}" ${m.handled ? 'checked' : ''}> تم الرد</label></article>`).join('')}</div>` : empty('inbox', 'لا رسائل'));
    $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $$('[data-h]').forEach(c => c.onchange = async () => { const { error: e } = await sb.from('kt_messages').update({ handled: c.checked }).eq('id', c.dataset.h); if (!e) data.find(m => String(m.id) === c.dataset.h).handled = c.checked; toast(e ? 'تعذر التحديث' : 'تم', e ? 'err' : ''); });
  };
  draw();
};

/* ======================= العملاء ======================= */
pages.customers = async el => {
  el.innerHTML = pgh('العملاء', 'مجمّعين من الطلبات برقم الموبايل') + skel(300);
  const { data, error } = await sb.from('kt_orders').select('customer_name,phone,city,total,status,created_at').order('created_at', { ascending: false }).limit(2000); if (error) throw error;
  const m = new Map();
  data.forEach(o => { const k = String(o.phone || '').replace(/\s/g, ''); if (!k) return; let c = m.get(k); if (!c) { c = { phone: k, name: o.customer_name, city: o.city, n: 0, done: 0, spent: 0, last: o.created_at }; m.set(k, c); } c.n++; if (o.status === 'delivered') { c.done++; c.spent += +o.total || 0; } });
  const all = [...m.values()].sort((a, b) => b.spent - a.spent || b.n - a.n); let q = '';
  const draw = () => {
    const list = all.filter(c => !q || `${c.name} ${c.phone} ${c.city}`.toLowerCase().includes(q));
    el.innerHTML = pgh('العملاء', `${all.length} عميل من آخر ${data.length} طلب`, `<button class="btn btn-g" id="ex">${ic('dl', 'sm')} تصدير CSV</button>`) +
      `<div class="tools"><input class="field" id="q" placeholder="ابحث بالاسم أو الموبايل أو المحافظة" value="${esc(q)}"></div>` +
      tbl(['العميل', 'المحافظة', 'الطلبات', 'مُسلّمة', 'إنفاق مُسلَّم', 'آخر طلب'], list.map(c => `<tr><td><b>${esc(c.name)}</b><span class="sub" dir="ltr" style="text-align:start"><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></span></td><td>${esc(c.city || '-')}</td><td>${c.n}</td><td>${c.done}</td><td>${money(c.spent)}</td><td>${date(c.last)}</td></tr>`), empty('users', 'لا عملاء'));
    $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); const p = e.target.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
    $('#ex').onclick = () => csv('customers.csv', [['الاسم', 'الموبايل', 'المحافظة', 'الطلبات', 'مُسلّمة', 'إنفاق مُسلَّم'], ...list.map(c => [c.name, c.phone, c.city, c.n, c.done, c.spent])]);
  };
  draw();
};

/* ======================= التسجيل ======================= */
window.Panel.start({
  base: BASE, home: '/', loginPath: '', brandSub: 'لوحة الإدارة', docTitle: 'لوحة الإدارة',
  aliases: { '/analytics': '/analistcs' },
  nav: [
    { path: '/', label: 'نظرة عامة', icon: 'home' }, { group: 'العمليات' },
    { path: '/orders', label: 'الطلبات', icon: 'bag' }, { path: '/products', label: 'المنتجات', icon: 'box' }, { path: '/product-requests', label: 'طلبات المنتجات', icon: 'check' }, { path: '/categories', label: 'الأقسام', icon: 'layers' }, { group: 'المتاجر الشريكة' },
    { path: '/stores', label: 'المتاجر', icon: 'store' }, { path: '/seller-request', label: 'طلبات البائعين', icon: 'users' }, { path: '/ads', label: 'الإعلانات', icon: 'target' }, { group: 'المال والنمو' },
    { path: '/money', label: 'الأموال', icon: 'wallet' }, { path: '/analistcs', label: 'التحليلات', icon: 'chart' }, { group: 'أخرى' }, { path: '/customers', label: 'العملاء', icon: 'users' }, { path: '/messages', label: 'الرسائل', icon: 'mail' }],
  footLinks: [{ href: '/', label: 'العودة للموقع', icon: 'ext' }],
  guard, badges, locked: () => '',
  routes: {
    '/': { title: 'نظرة عامة', view: pages.overview }, '/orders': { title: 'الطلبات', view: pages.orders }, '/products': { title: 'المنتجات', view: pages.products }, '/product-requests': { title: 'طلبات المنتجات', view: pages['product-requests'] },
    '/categories': { title: 'الأقسام', view: pages.categories }, '/stores': { title: 'المتاجر', view: pages.stores }, '/seller-request': { title: 'طلبات البائعين', view: pages['seller-request'] }, '/ads': { title: 'الإعلانات', view: pages.ads },
    '/money': { title: 'الأموال', view: pages.money }, '/analistcs': { title: 'التحليلات', view: pages.analytics }, '/customers': { title: 'العملاء', view: pages.customers }, '/messages': { title: 'الرسائل', view: pages.messages }
  }
});
})();
