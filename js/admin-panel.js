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

/* ======================= الحماية + الدخول (صفحة خارجية بحساب مستقل) ======================= */
async function adminCheck() {
  const { data: { session } } = await sb.auth.getSession(); if (!session) return 'انتهت الجلسة، سجّل دخولك مرة أخرى';
  const { data: ok } = await sb.rpc('kt_is_admin');
  return ok === true ? true : `الحساب ${session.user.email} ليس ضمن مديري المتجر. اطلب من مدير إضافة إيميلك (من لوحة فريق العمل ← فريقي) ثم سجّل دخولك.`;
}
function loginScreen() {
  document.title = 'دخول الإدارة | Kitchenly';
  window.Panel.staffAuth($('#root'), { role: 'الإدارة', title: 'لوحة إدارة Kitchenly', sub: 'للمديرين المسجّلين فقط.', art: '/assets/img/pages/admin-login.webp',
    bullets: [['users', 'مراجعة المتاجر الجديدة والمنتجات'], ['wallet', 'المبيعات والعمولات وتحويلات البائعين'], ['chart', 'تحليلات المتجر والزيارات']],
    check: adminCheck, onDone: () => window.Panel.refresh() });
}
async function guard() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { loginScreen(); return null; }
  const { data: ok } = await sb.rpc('kt_is_admin');
  if (ok !== true) {
    $('#root').innerHTML = `<div style="min-height:100vh;display:grid;place-items:center;padding:20px"><div class="card" style="max-width:440px;text-align:center;display:grid;gap:12px;justify-items:center">${ic('lock', 'lg')}<h1 style="font-size:1.4rem">غير مصرح</h1><p style="color:var(--muted)">حساب <b dir="ltr">${esc(session.user.email)}</b> ليس ضمن مديري المتجر.</p><div style="display:flex;gap:8px"><a class="btn btn-p" href="/">العودة للموقع</a><button class="btn btn-g" id="so">تبديل الحساب</button></div></div></div>`;
    $('#so').onclick = async () => { await window.Panel.signOutLocal(); window.Panel.refresh(); }; return null;
  }
  return { user: session.user, name: 'مدير المتجر' };
}
const badges = async () => {
  const [a, b, c, d, n] = await Promise.all([count('kt_products', q => q.eq('approval_status', 'pending').not('store_id', 'is', null)), count('kt_stores', q => q.eq('status', 'pending')), count('kt_ads', q => q.eq('status', 'pending')), count('kt_payouts', q => q.eq('status', 'pending')), count('kt_orders', q => q.eq('status', 'new'))]);
  return { '/product-requests/waiting-for-check': a, '/seller-request': b, '/ads': c, '/money': d, '/orders/new': n };
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

/* ======================= الطلبات: orders/all ... orders/canceled + صفحة تفاصيل الطلب ======================= */
const OROUTE = { all: null, new: 'new', confirmed: 'confirmed', shipping: 'shipping', delivered: 'delivered', canceled: 'cancelled' };
const OTITLE = { all: 'كل الطلبات', new: 'طلبات جديدة', confirmed: 'تم التأكيد', shipping: 'في الطريق', delivered: 'تم التسليم', canceled: 'الطلبات الملغية' };
const PAY = { cod: 'عند الاستلام', wallet: 'محفظة', online: 'أونلاين', instapay: 'إنستا باي' };
const osfx = id => { let h = 5381; for (const c of String(id)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h.toString(36).slice(-3).padStart(3, '0'); };
const orderHref = o => `${BASE}/orders/order-details${encodeURIComponent(o.order_no)}-${osfx(o.id)}`;
const itemsOf = o => (Array.isArray(o.items) ? o.items : []);
const itemsTxt = o => { const it = itemsOf(o); return it.slice(0, 2).map(i => `<span class="sub" style="color:var(--ink)">${esc(i.name || i.slug)} × ${i.qty || 1}</span>`).join('') + (it.length > 2 ? `<span class="sub">+ ${it.length - 2} منتجات أخرى</span>` : ''); };

function ordersList(el, sk) {
  const status = OROUTE[sk]; let q = '', loaded = [];
  const tabs = Object.keys(OTITLE).map(k => `<a data-l href="${BASE}/orders/${k}" aria-current="${k === sk}">${OTITLE[k]}</a>`).join('');
  el.innerHTML = pgh(OTITLE[sk], `<span id="tot">...</span>`, `<button class="btn btn-g no-print" id="ex">${ic('dl', 'sm')} تصدير المحمّل CSV</button>`) +
    `<div class="tabs">${tabs}</div><div class="tools"><input class="field" id="q" placeholder="رقم الطلب أو العميل أو الموبايل"></div><div id="list"></div>`;
  const P = window.Panel.pager($('#list', el), {
    size: 20, emptyHtml: empty('bag', 'لا توجد طلبات هنا'),
    onTotal: n => { $('#tot', el).textContent = `${fmt(n)} طلب`; },
    fetchPage: async (off, n) => {
      let r = sb.from('kt_orders').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(off, off + n - 1);
      if (status) r = r.eq('status', status);
      if (q) r = r.or(`order_no.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%`);
      const { data, error, count: total } = await r; if (error) throw error; return { rows: data || [], total };
    },
    renderRows: (rows, first, host) => {
      if (first) { loaded = []; host.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${['الطلب', 'العميل', 'المنتجات', 'الدفع', 'الإجمالي', 'الحالة', ''].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody data-tb></tbody></table></div>`; }
      loaded.push(...rows);
      $('[data-tb]', host).insertAdjacentHTML('beforeend', rows.map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.order_no)}</b><span class="sub">${dt(o.created_at)}</span></td><td>${esc(o.customer_name)}<span class="sub" dir="ltr" style="text-align:start"><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></span><span class="sub">${esc(o.city || '')}</span></td><td>${itemsTxt(o)}</td><td>${PAY[o.payment_method] || esc(o.payment_method || '-')}</td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td><td class="act"><a class="btn btn-g btn-sm" data-l href="${orderHref(o)}">عرض التفاصيل</a></td></tr>`).join(''));
    }
  });
  $('#q', el).oninput = window.Panel.debounce(e => { q = window.Panel.qClean(e.target.value); P.reload(); });
  $('#ex', el).onclick = () => csv('orders.csv', [['رقم الطلب', 'التاريخ', 'العميل', 'الموبايل', 'المحافظة', 'العنوان', 'الدفع', 'الإجمالي', 'الحالة'], ...loaded.map(o => [o.order_no, dt(o.created_at), o.customer_name, o.phone, o.city, o.address, o.payment_method, o.total, (ORDER[o.status] || [o.status])[0]])]);
}
for (const k of Object.keys(OROUTE)) pages['orders-' + k] = el => ordersList(el, k);

const waNum = p => { const d = String(p || '').replace(/\D/g, ''); return d.startsWith('0') ? '2' + d : d; };
pages.orderDetails = async (el, c, params) => {
  const no = decodeURIComponent(params.m[1]), sx = params.m[2];
  const { data: found, error } = await sb.from('kt_orders').select('*').eq('order_no', no).limit(5); if (error) throw error;
  const o = (found || []).find(x => osfx(x.id) === sx);
  if (!o) { el.innerHTML = empty('bag', 'الطلب غير موجود', 'تأكد من الرابط أو ارجع لقائمة الطلبات.', `<a class="btn btn-p" data-l href="${BASE}/orders/all">كل الطلبات</a>`); return; }
  const items = itemsOf(o), slugs = [...new Set(items.map(i => i.slug).filter(Boolean))];
  const { data: prods } = slugs.length ? await sb.from('kt_products').select('slug,name,image,store_id,price').in('slug', slugs) : { data: [] };
  const pm = Object.fromEntries((prods || []).map(p => [p.slug, p])), sids = [...new Set((prods || []).map(p => p.store_id).filter(Boolean))];
  const { data: stores } = sids.length ? await sb.from('kt_stores').select('id,name,slug,phone').in('id', sids) : { data: [] };
  const sm = Object.fromEntries((stores || []).map(s => [s.id, s]));
  const line = i => { const p = pm[i.slug] || {}, price = +(i.price ?? p.price) || 0, qty = +i.qty || 1; return { i, p, price, qty, tot: price * qty, store: p.store_id ? sm[p.store_id] : null }; };
  const lines = items.map(line), sub = sum(lines, l => l.tot), diff = (+o.total || 0) - sub;
  const FLOW = ['new', 'confirmed', 'shipping', 'delivered'], NEXT = { new: ['confirmed', 'تأكيد الطلب'], confirmed: ['shipping', 'الطلب في الطريق'], shipping: ['delivered', 'تم التسليم'] };
  const draw = () => {
    const cx = o.status === 'cancelled', idx = FLOW.indexOf(o.status);
    el.innerHTML = pgh(`طلب <span dir="ltr">${esc(o.order_no)}</span> ${orderBadge(o.status)}`, `${dt(o.created_at)}`, `<div class="no-print" style="display:flex;gap:8px"><a class="btn btn-g" data-l href="${BASE}/orders/${cx ? 'canceled' : 'all'}">رجوع للطلبات</a><button class="btn btn-g" id="pr">طباعة</button></div>`) +
    `<div class="od"><div class="od__main grid"><div class="card"><div class="card__head"><h3>المنتجات (${items.length})</h3></div>` +
    (lines.length ? `<div class="tbl-wrap" style="box-shadow:none"><table class="tbl"><thead><tr><th>المنتج</th><th>المتجر</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead><tbody>${lines.map(l => `<tr><td><div class="thumb">${l.p.image ? `<img src="${esc(l.p.image)}" alt="" loading="lazy">` : '<span class="thumb-i"></span>'}<div><b>${esc(l.i.name || l.p.name || l.i.slug)}</b>${l.i.slug ? `<a class="sub" dir="ltr" style="text-align:start" href="/product/${esc(l.i.slug)}" target="_blank" rel="noopener">/product/${esc(l.i.slug)}</a>` : ''}</div></div></td><td>${esc(l.store?.name || 'Kitchenly')}</td><td>${money(l.price)}</td><td>${l.qty}</td><td>${money(l.tot)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">لا توجد بيانات منتجات</p>') +
    `<ul class="tot" style="margin-top:12px"><li><span>إجمالي المنتجات</span><span>${money(sub)}</span></li>${Math.abs(diff) > 0.009 ? `<li><span>${diff > 0 ? 'الشحن والرسوم' : 'خصم'}</span><span>${money(Math.abs(diff))}</span></li>` : ''}<li class="big"><span>الإجمالي</span><span>${money(o.total)}</span></li></ul></div>` +
    (o.notes ? `<div class="card"><div class="card__head"><h3>ملاحظات العميل</h3></div><p style="white-space:pre-wrap">${esc(o.notes)}</p></div>` : '') + `</div>` +
    `<aside class="od__side"><div class="card no-print"><div class="card__head"><h3>حالة الطلب</h3></div>${cx ? `<ul class="ostep cx"><li class="on">ملغي</li></ul>` : `<ul class="ostep">${FLOW.map((s, i) => `<li class="${i <= idx ? 'on' : ''}">${ORDER[s][0]}</li>`).join('')}</ul>`}` +
    `${NEXT[o.status] ? `<button class="btn btn-p btn-block" id="nx" style="margin-bottom:10px">${NEXT[o.status][1]}</button>` : ''}<label class="lbl" for="st">تغيير الحالة يدويًا</label><div style="display:flex;gap:8px"><select class="field" id="st">${Object.entries(ORDER).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select><button class="btn btn-g" id="sv">حفظ</button></div></div>` +
    `<div class="card"><div class="card__head"><h3>العميل</h3></div><dl class="kv"><dt>الاسم</dt><dd>${esc(o.customer_name)}</dd><dt>الموبايل</dt><dd dir="ltr" style="text-align:start"><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a></dd><dt>المحافظة</dt><dd>${esc(o.city || '-')}</dd><dt>العنوان</dt><dd>${esc(o.address || '-')}</dd></dl><div class="no-print" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><a class="btn btn-g btn-sm" href="tel:${esc(o.phone)}">اتصال</a><a class="btn btn-ok btn-sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(o.phone)}">واتساب</a></div></div>` +
    `<div class="card"><div class="card__head"><h3>الدفع</h3></div><dl class="kv"><dt>الطريقة</dt><dd>${PAY[o.payment_method] || esc(o.payment_method || '-')}</dd><dt>المبلغ</dt><dd>${moneyT(o.total)}</dd></dl></div></aside></div>`;
    $('#pr', el).onclick = () => window.print();
    const setStatus = async s => {
      if (s === o.status) return;
      if (s === 'cancelled' && !(await ask('إلغاء الطلب؟', 'إلغاء الطلب', true))) { draw(); return; }
      const { error: e } = await sb.from('kt_orders').update({ status: s }).eq('id', o.id);
      if (e) { toast('تعذر تحديث الحالة', 'err'); draw(); return; }
      o.status = s; toast('تم تحديث الحالة'); draw(); window.Panel.refreshBadges();
    };
    $('#sv', el).onclick = () => setStatus($('#st', el).value);
    $('#nx', el)?.addEventListener('click', () => setStatus(NEXT[o.status][0]));
  };
  draw();
};

/* ======================= المنتجات (تحميل تدريجي: 20 منتج كل مرة) ======================= */
pages.products = async (el, c) => {
  const [{ data: cats }, { data: stores }] = await Promise.all([sb.from('kt_categories').select('id,name').order('sort'), sb.from('kt_stores').select('id,name')]);
  const sn = Object.fromEntries((stores || []).map(s => [s.id, s.name])), byId = new Map(); let f = 'all', q = '';
  el.innerHTML = pgh('المنتجات', '<span id="tot">...</span>', `<button class="btn btn-p" id="np">${ic('plus', 'sm')} منتج جديد</button>`) +
    `<div class="tools"><div class="chips">${[['all', 'الكل'], ['own', 'منتجاتنا'], ['sellers', 'منتجات البائعين']].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div><input class="field" id="q" placeholder="ابحث باسم المنتج"></div><div id="list"></div>`;
  const open = p => productForm({ p, cats: cats || [], uid: c.user.id, admin: true, onSaved: () => P.reload() });
  const P = window.Panel.pager($('#list', el), {
    size: 20, emptyHtml: empty('box', 'لا منتجات'), onTotal: n => { $('#tot', el).textContent = `${fmt(n)} منتج`; },
    fetchPage: async (off, n) => {
      let r = sb.from('kt_products').select('*, category:kt_categories(name)', { count: 'exact' }).order('created_at', { ascending: false }).range(off, off + n - 1);
      if (f === 'own') r = r.is('store_id', null); else if (f === 'sellers') r = r.not('store_id', 'is', null);
      if (q) r = r.ilike('name', `%${q}%`);
      const { data, error, count: total } = await r; if (error) throw error; return { rows: data || [], total };
    },
    renderRows: (rows, first, host) => {
      if (first) { byId.clear(); host.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${['المنتج', 'المتجر', 'القسم', 'السعر', 'المخزون', 'الحالة', ''].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody data-tb></tbody></table></div>`; }
      rows.forEach(p => byId.set(p.id, p));
      $('[data-tb]', host).insertAdjacentHTML('beforeend', rows.map(p => `<tr data-row="${p.id}"><td><div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"><b>${esc(p.name)}</b></div></td><td>${esc(sn[p.store_id] || 'Kitchenly')}</td><td>${esc(p.category?.name || '-')}</td><td>${money(p.price)}${p.old_price > p.price ? '<span class="sub">عرض</span>' : ''}</td><td>${p.stock}</td><td>${sBadge(PROD, p.approval_status)} ${p.active ? '' : badge('', 'مخفي')}</td><td class="act"><button class="btn btn-g btn-sm" data-e="${p.id}">تعديل</button> <button class="btn btn-d btn-sm" data-d="${p.id}">حذف</button></td></tr>`).join(''));
    }
  });
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-e],[data-d]'); if (!b) return;
    if (b.dataset.e) return open(byId.get(b.dataset.e));
    if (!(await ask('حذف المنتج نهائيًا؟', 'حذف', true))) return;
    const { error: er } = await sb.from('kt_products').delete().eq('id', b.dataset.d); toast(er ? 'تعذر الحذف' : 'تم الحذف', er ? 'err' : '');
    if (!er) $(`[data-row="${b.dataset.d}"]`, el)?.remove();
  });
  $$('[data-f]', el).forEach(b => b.onclick = () => { f = b.dataset.f; $$('[data-f]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); P.reload(); });
  $('#q', el).oninput = window.Panel.debounce(e => { q = window.Panel.qClean(e.target.value); P.reload(); });
  $('#np', el).onclick = () => open(null);
};

/* ======================= طلبات المنتجات: waiting-for-check / approved / canceld ======================= */
const PRROUTE = { 'waiting-for-check': ['pending', 'قيد المراجعة'], approved: ['approved', 'المعتمدة'], canceld: ['rejected', 'المرفوضة'] };
const storeNames = {};
async function loadStoreNames(ids) {
  const miss = [...new Set(ids.filter(i => i && !(i in storeNames)))]; if (!miss.length) return;
  const { data } = await sb.from('kt_stores').select('id,name').in('id', miss); (data || []).forEach(s => { storeNames[s.id] = s.name; }); miss.forEach(i => { storeNames[i] ??= '-'; });
}
function productRequests(el, key) {
  const [status] = PRROUTE[key], byId = new Map();
  el.innerHTML = pgh('طلبات المنتجات', 'راجع منتجات البائعين قبل ظهورها في الموقع <b id="tot"></b>') + `<div class="tabs">${Object.entries(PRROUTE).map(([k, v]) => `<a data-l href="${BASE}/product-requests/${k}" aria-current="${k === key}">${v[1]}</a>`).join('')}</div><div id="list"></div>`;
  window.Panel.pager($('#list', el), {
    size: 10, emptyHtml: empty('check', status === 'pending' ? 'لا منتجات بانتظار المراجعة' : 'لا نتائج'), onTotal: n => { $('#tot', el).textContent = `(${fmt(n)})`; },
    fetchPage: async (off, n) => {
      const { data, error, count: total } = await sb.from('kt_products').select('*, category:kt_categories(name)', { count: 'exact' }).not('store_id', 'is', null).eq('approval_status', status).order('created_at', { ascending: false }).range(off, off + n - 1);
      if (error) throw error; await loadStoreNames((data || []).map(p => p.store_id)); return { rows: data || [], total };
    },
    renderRows: (rows, first, host) => {
      if (first) { byId.clear(); host.innerHTML = '<div class="grid" data-g></div>'; }
      rows.forEach(p => byId.set(p.id, p));
      $('[data-g]', host).insertAdjacentHTML('beforeend', rows.map(p => `<article class="card pcard-r" data-card="${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy"><div><h3>${esc(p.name)} ${sBadge(PROD, p.approval_status)}</h3><p>${esc(storeNames[p.store_id] || '-')} • ${esc(p.category?.name || '-')} • ${moneyT(p.price)}${p.old_price > p.price ? ` <s>${moneyT(p.old_price)}</s>` : ''} • مخزون ${p.stock}</p><p style="margin-top:4px">${esc((p.description || '').slice(0, 160))}${(p.description || '').length > 160 ? '...' : ''}</p>${p.reject_reason ? `<p style="color:var(--red)">سبب الرفض: ${esc(p.reject_reason)}</p>` : ''}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g btn-sm" data-v="${p.id}">تفاصيل</button>${p.approval_status !== 'approved' ? `<button class="btn btn-ok btn-sm" data-a="${p.id}">اعتماد</button>` : ''}${p.approval_status !== 'rejected' ? `<button class="btn btn-d btn-sm" data-r="${p.id}">رفض</button>` : ''}</div></article>`).join(''));
    }
  });
  const upd = async (id, row, msg) => { const { error: e } = await sb.from('kt_products').update(row).eq('id', id); toast(e ? 'تعذر التنفيذ' : msg, e ? 'err' : ''); if (!e) { $(`[data-card="${id}"]`, el)?.remove(); window.Panel.refreshBadges(); } };
  el.onclick = async e => {
    const b = e.target.closest('[data-a],[data-r],[data-v]'); if (!b) return;
    if (b.dataset.a) return upd(b.dataset.a, { approval_status: 'approved', reject_reason: null }, 'تم اعتماد المنتج');
    if (b.dataset.r) { const r = await reason('رفض المنتج'); if (r) upd(b.dataset.r, { approval_status: 'rejected', reject_reason: r }, 'تم رفض المنتج'); return; }
    const p = byId.get(b.dataset.v); if (!p) return;
    modal(`<div class="dlg"><h2>${esc(p.name)}</h2><div class="upl"><img src="${esc(p.image)}" alt="" style="width:120px;height:120px"><dl class="kv"><dt>المتجر</dt><dd>${esc(storeNames[p.store_id] || '-')}</dd><dt>القسم</dt><dd>${esc(p.category?.name || '-')}</dd><dt>السعر</dt><dd>${moneyT(p.price)}</dd><dt>المخزون</dt><dd>${p.stock}</dd></dl></div><p>${esc(p.short_desc || '')}</p><p style="white-space:pre-wrap">${esc(p.description || '')}</p>${(p.features || []).length ? `<ul class="rows">${p.features.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${(p.images || []).length > 1 ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${p.images.map(i => `<img src="${esc(i)}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:10px">`).join('')}</div>` : ''}<div class="dlg__foot"><button class="btn btn-g" onclick="this.closest('dialog').close()">إغلاق</button></div></div>`);
  };
}
for (const k of Object.keys(PRROUTE)) pages['pr-' + k] = el => productRequests(el, k);

/* ======================= كروت المتاجر (تحميل تدريجي + كل التفاصيل والصور) ======================= */
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
pages.stores = el => storeList(el);
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
  aliases: { '/analytics': '/analistcs', '/orders': '/orders/all', '/product-requests': '/product-requests/waiting-for-check', '/product-requests/canceled': '/product-requests/canceld' },
  patterns: [[/^\/orders\/order-details(.+)-([a-z0-9]{3})$/, { title: 'تفاصيل الطلب', nav: '/orders', view: pages.orderDetails }]],
  nav: [
    { path: '/', label: 'نظرة عامة', icon: 'home' }, { group: 'العمليات' },
    { path: '/orders', label: 'الطلبات', icon: 'bag' }, { path: '/orders/all', label: 'كل الطلبات', sub: true }, { path: '/orders/new', label: 'جديدة', sub: true }, { path: '/orders/confirmed', label: 'تم التأكيد', sub: true }, { path: '/orders/shipping', label: 'في الطريق', sub: true }, { path: '/orders/delivered', label: 'تم التسليم', sub: true }, { path: '/orders/canceled', label: 'ملغية', sub: true }, { path: '/products', label: 'المنتجات', icon: 'box' }, { path: '/product-requests', label: 'طلبات المنتجات', icon: 'check' }, { path: '/product-requests/waiting-for-check', label: 'بانتظار المراجعة', sub: true }, { path: '/product-requests/approved', label: 'المعتمدة', sub: true }, { path: '/product-requests/canceld', label: 'المرفوضة', sub: true }, { path: '/categories', label: 'الأقسام', icon: 'layers' }, { group: 'المتاجر الشريكة' },
    { path: '/stores', label: 'المتاجر', icon: 'store' }, { path: '/seller-request', label: 'طلبات البائعين', icon: 'users' }, { path: '/ads', label: 'الإعلانات', icon: 'target' }, { group: 'المال والنمو' },
    { path: '/money', label: 'الأموال', icon: 'wallet' }, { path: '/analistcs', label: 'التحليلات', icon: 'chart' }, { group: 'أخرى' }, { path: '/customers', label: 'العملاء', icon: 'users' }, { path: '/messages', label: 'الرسائل', icon: 'mail' }],
  footLinks: [{ href: '/', label: 'العودة للموقع', icon: 'ext' }],
  guard, badges, locked: () => '',
  routes: {
    '/': { title: 'نظرة عامة', view: pages.overview }, '/orders/all': { title: 'كل الطلبات', view: pages['orders-all'] }, '/orders/new': { title: 'طلبات جديدة', view: pages['orders-new'] }, '/orders/confirmed': { title: 'طلبات تم تأكيدها', view: pages['orders-confirmed'] }, '/orders/shipping': { title: 'طلبات في الطريق', view: pages['orders-shipping'] }, '/orders/delivered': { title: 'طلبات تم تسليمها', view: pages['orders-delivered'] }, '/orders/canceled': { title: 'الطلبات الملغية', view: pages['orders-canceled'] }, '/products': { title: 'المنتجات', view: pages.products }, '/product-requests/waiting-for-check': { title: 'طلبات المنتجات: بانتظار المراجعة', view: pages['pr-waiting-for-check'] }, '/product-requests/approved': { title: 'طلبات المنتجات: المعتمدة', view: pages['pr-approved'] }, '/product-requests/canceld': { title: 'طلبات المنتجات: المرفوضة', view: pages['pr-canceld'] },
    '/categories': { title: 'الأقسام', view: pages.categories }, '/stores': { title: 'المتاجر', view: pages.stores }, '/seller-request': { title: 'طلبات البائعين', view: pages['seller-request'] }, '/ads': { title: 'الإعلانات', view: pages.ads },
    '/money': { title: 'الأموال', view: pages.money }, '/analistcs': { title: 'التحليلات', view: pages.analytics }, '/customers': { title: 'العملاء', view: pages.customers }, '/messages': { title: 'الرسائل', view: pages.messages }
  }
});
})();
