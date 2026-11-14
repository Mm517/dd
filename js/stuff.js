/* Kitchenly - لوحة فريق العمل: /stuff/... (صفحة كاملة مستقلة). الصلاحية: kt_is_admin() + RLS.
   المسارات: login, help-requests(/users,/seller), store(/details,/details/products,/details/images,/details/money), my-team */
(() => {
'use strict';
const { sb, $, $$, esc, fmt, money, moneyT, date, dt, ic, toast, modal, ask, skel, empty, errBox, badge, orderBadge, areaChart, lastDays, dkey, sum, csv, loadSales, groupOrders, uploadImage, productForm } = window.Panel;
const K = window.KT, BASE = '/stuff';
const pgh = (t, s, act = '') => `<div class="pgh"><div><h2>${t}</h2>${s ? `<p>${s}</p>` : ''}</div><div>${act}</div></div>`;
const stat = (icon, label, val, d = '', cls = '') => `<div class="card stat ${cls}"><div class="stat__l">${ic(icon)}${label}</div><div class="stat__v">${val}</div>${d ? `<div class="stat__d">${d}</div>` : ''}</div>`;
const tbl = (head, rows, empt) => rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empt;
const field = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
const SI = { wallet: 'stuff-money', users: 'stuff-team', help: 'stuff-help' };
const ico = (n, c = '') => (SI[n] ? `<img class="sicon" src="/assets/img/icons/${SI[n]}.png" alt="" width="56" height="56" loading="lazy">` : ic(n, c));
const live = l => l.filter(x => x.status !== 'cancelled');
const SELLER_RX = /\[(دعم بائع|طلب انضمام)\]/;
const isSeller = m => SELLER_RX.test(m.body || '') || /\(بائع\)/.test(m.name || '');
const keepFocus = (el, sel, fn) => e => { const p = e.target.selectionStart; fn(e.target.value.trim().toLowerCase()); const n = $(sel, el); if (n) { n.focus(); n.setSelectionRange(p, p); } };

/* ======================= الدخول ======================= */
function loginView(root, { next, go }) {
  const check = async () => { const { data: ok } = await sb.rpc('kt_is_admin'); return ok === true ? true : 'هذا الحساب ليس ضمن فريق العمل. اطلب من المدير إضافة إيميلك من «فريقي» ثم سجّل دخولك.'; };
  sb.auth.getSession().then(async ({ data: { session } }) => {
    if (session && (await check()) === true) { go(next, true); return; }
    window.Panel.staffAuth(root, { role: 'فريق العمل', title: 'إدارة المتجر والطلبات والمنتجات في مكان واحد', sub: 'للحسابات المسجّلة ضمن فريق العمل.', art: '/assets/img/pages/seller-login.webp', check, onDone: () => go(next, true) });
  });
}
async function guard({ go }) {
  const { data: { session } } = await sb.auth.getSession();
  const toLogin = () => { go(`${BASE}/login?next=${encodeURIComponent(location.pathname)}`, true); return null; };
  if (!session) return toLogin();
  const { data: ok } = await sb.rpc('kt_is_admin');
  if (ok !== true) { await window.Panel.signOutLocal(); return toLogin(); }
  return { user: session.user, name: 'فريق العمل' };
}
const badges = async () => {
  const { data } = await sb.from('kt_messages').select('body,name').eq('handled', false).limit(500);
  const l = data || [], s = l.filter(isSeller).length;
  return { '/help-requests': l.length, '/help-requests/users': l.length - s, '/help-requests/seller': s };
};

/* ======================= طلبات المساعدة ======================= */
const helpTabs = cur => `<div class="tabs">${[['', 'الكل'], ['/users', 'العملاء'], ['/seller', 'البائعون']].map(([p, t]) => `<a data-l href="${BASE}/help-requests${p}" aria-current="${cur === p}">${t}</a>`).join('')}</div>`;
async function helpList(el, kind) {
  const titles = { '': ['طلبات المساعدة', 'كل رسائل العملاء والبائعين'], '/users': ['طلبات العملاء', 'رسائل العملاء من صفحة اتصل بنا'], '/seller': ['طلبات البائعين', 'دعم البائعين وطلبات الانضمام'] };
  const [t, s] = titles[kind];
  el.innerHTML = pgh(t, s) + helpTabs(kind) + skel(240);
  const { data, error } = await sb.from('kt_messages').select('*').order('created_at', { ascending: false }).limit(300); if (error) throw error;
  const all = data.filter(m => kind === '' || (kind === '/seller') === isSeller(m)); let f = 'open';
  const draw = () => {
    const list = all.filter(m => f === 'all' || (f === 'open' ? !m.handled : m.handled));
    el.innerHTML = pgh(t, s) + helpTabs(kind) + `<div class="tools"><div class="chips">${[['open', `بدون رد (${all.filter(m => !m.handled).length})`], ['done', 'تم الرد'], ['all', 'الكل']].map(([k, x]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${x}</button>`).join('')}</div></div>` +
      (list.length ? `<div class="grid">${list.map(m => `<article class="card"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><b>${esc(m.name)} ${kind === '' ? badge(isSeller(m) ? 'b-blue' : '', isSeller(m) ? 'بائع' : 'عميل') : ''}</b><span style="color:var(--muted);font-size:.85rem">${dt(m.created_at)}</span></div>${m.phone ? `<p dir="ltr" style="text-align:start;font-size:.88rem;color:var(--muted)"><a href="tel:${esc(m.phone)}">${esc(m.phone)}</a></p>` : ''}<p style="margin-top:8px;white-space:pre-wrap">${esc(m.body)}</p><label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-size:.9rem"><input type="checkbox" data-h="${m.id}" ${m.handled ? 'checked' : ''}> تم الرد</label></article>`).join('')}</div>` : empty('inbox', 'لا توجد طلبات هنا', 'كل الرسائل تم الرد عليها'));
    $$('[data-f]', el).forEach(b => b.onclick = () => { f = b.dataset.f; draw(); });
    $$('[data-h]', el).forEach(c => c.onchange = async () => { const { error: e } = await sb.from('kt_messages').update({ handled: c.checked }).eq('id', c.dataset.h); if (!e) { data.find(m => String(m.id) === c.dataset.h).handled = c.checked; window.Panel.refresh?.(); } toast(e ? 'تعذر التحديث' : 'تم', e ? 'err' : ''); });
  };
  draw();
}
const pages = {};
pages.help = async el => {
  el.innerHTML = pgh('طلبات المساعدة', 'متابعة رسائل العملاء والبائعين') + skel(160);
  const { data, error } = await sb.from('kt_messages').select('body,name,handled').limit(1000); if (error) throw error;
  const s = data.filter(isSeller), u = data.filter(m => !isSeller(m)), open = l => l.filter(m => !m.handled).length;
  el.innerHTML = pgh('طلبات المساعدة', 'متابعة رسائل العملاء والبائعين') + helpTabs('') +
    `<div class="grid g3">${[['/users', 'help', 'طلبات العملاء', u], ['/seller', 'store', 'طلبات البائعين', s]].map(([p, i, tt, l]) => `<a data-l href="${BASE}/help-requests${p}" class="card" style="display:flex;gap:12px;align-items:center">${ico(i, 'lg')}<div><b>${tt}</b><p style="color:var(--muted);font-size:.9rem">${open(l)} بدون رد من ${l.length}</p></div></a>`).join('')}</div>`;
};
pages.helpUsers = el => helpList(el, '/users');
pages.helpSeller = el => helpList(el, '/seller');
pages.helpAll = el => helpList(el, '');

/* ======================= المتجر ======================= */
const OWN = q => q.is('store_id', null);
const detailTabs = cur => `<div class="tabs">${[['/store/details', 'بيانات المتجر'], ['/store/details/products', 'المنتجات'], ['/store/details/images', 'الصور'], ['/store/details/money', 'الأموال']].map(([p, t]) => `<a data-l href="${BASE}${p}" aria-current="${cur === p}">${t}</a>`).join('')}</div>`;

pages.store = async el => {
  el.innerHTML = pgh('المتجر', 'ملخص متجر Kitchenly ومنتجاتنا') + `<div class="grid g4 keep2">${[1, 2, 3, 4].map(() => skel(100)).join('')}</div>`;
  const [{ data: prods, error }, lines] = await Promise.all([OWN(sb.from('kt_products').select('id,active,stock,approval_status')), loadSales(null)]);
  if (error) throw error;
  const own = live(lines.filter(l => !l.store_id)), now = Date.now(), l30 = own.filter(l => now - new Date(l.created_at) < 30 * 864e5);
  const act = prods.filter(p => p.active), low = act.filter(p => p.stock > 0 && p.stock <= 5).length, out = act.filter(p => p.stock <= 0).length;
  el.innerHTML = pgh('المتجر', 'ملخص متجر Kitchenly ومنتجاتنا') +
    `<div class="grid g4 keep2">${stat('box', 'منتجاتنا', prods.length, `${act.length} ظاهر في المتجر`, 'stat--hl')}${stat('clock', 'مخزون قليل', low, 'أقل من 6 قطع')}${stat('x', 'نفد من المخزون', out)}${stat('cash', 'مبيعات 30 يوم', money(sum(l30, l => l.total)), `${groupOrders(l30).length} طلب`)}</div>
    <div class="grid g3" style="margin-top:16px">${[['/store/details', 'store', 'بيانات المتجر'], ['/store/details/products', 'box', 'المنتجات'], ['/store/details/images', 'layers', 'الصور'], ['/store/details/money', 'wallet', 'الأموال']].map(([p, i, t]) => `<a data-l href="${BASE}${p}" class="card" style="display:flex;gap:12px;align-items:center">${ico(i, 'lg')}<b>${t}</b></a>`).join('')}</div>`;
};

pages.details = async el => {
  const { data: cats } = await sb.from('kt_categories').select('id').limit(50);
  el.innerHTML = pgh('بيانات المتجر', 'إعدادات Kitchenly الحالية (للقراءة، تتعدل من config.js)') + detailTabs('/store/details') +
    `<div class="grid g2"><div class="card"><div class="card__head"><h3>المتجر</h3></div><dl class="kv"><dt>الاسم</dt><dd>Kitchenly</dd><dt>الأقسام</dt><dd>${(cats || []).length}</dd><dt>رابط المتجر</dt><dd dir="ltr" style="text-align:start"><a class="btn-link" href="/" target="_blank" rel="noopener">${esc(location.origin)}</a></dd></dl></div>
    <div class="card"><div class="card__head"><h3>الشحن والتواصل</h3></div><dl class="kv"><dt>رسوم الشحن</dt><dd>${moneyT(K.shippingFee)}</dd><dt>شحن مجاني فوق</dt><dd>${moneyT(K.freeShipFrom)}</dd><dt>الهاتف</dt><dd dir="ltr" style="text-align:start">${esc(K.phone)}</dd><dt>واتساب</dt><dd dir="ltr" style="text-align:start">${esc(K.whatsapp)}</dd></dl></div></div>`;
};

pages.products = async (el, c) => {
  el.innerHTML = pgh('منتجات المتجر', 'منتجات Kitchenly الخاصة (بدون منتجات البائعين)') + detailTabs('/store/details/products') + skel(260);
  const [{ data: cats }, { data: list, error }] = await Promise.all([sb.from('kt_categories').select('*').order('sort'), OWN(sb.from('kt_products').select('*, category:kt_categories(name)')).order('created_at', { ascending: false })]);
  if (error) throw error; let q = '';
  const open = p => productForm({ p, cats: cats || [], uid: c.user.id, admin: true, onSaved: () => pages.products(el, c) });
  const draw = () => {
    const rows = list.filter(p => !q || p.name.toLowerCase().includes(q));
    el.innerHTML = pgh('منتجات المتجر', `${list.length} منتج`, `<button class="btn btn-p" id="np">${ic('plus', 'sm')} منتج جديد</button>`) + detailTabs('/store/details/products') +
      `<div class="tools"><input class="field" id="q" placeholder="ابحث باسم المنتج" value="${esc(q)}"></div>` +
      tbl(['المنتج', 'القسم', 'السعر', 'المخزون', 'الحالة', ''], rows.map(p => `<tr><td><div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy"><b>${esc(p.name)}</b></div></td><td>${esc(p.category?.name || '-')}</td><td>${money(p.price)}${p.old_price > p.price ? `<span class="sub"><s>${fmt(p.old_price)}</s></span>` : ''}</td><td>${p.stock}</td><td>${badge(p.active ? 'b-ok' : '', p.active ? 'ظاهر' : 'مخفي')}</td><td class="act"><button class="btn btn-g btn-sm" data-e="${p.id}">تعديل</button><button class="btn btn-g btn-sm" data-t="${p.id}">${p.active ? 'إخفاء' : 'إظهار'}</button><button class="btn btn-d btn-sm" data-d="${p.id}">حذف</button></td></tr>`), empty('box', 'لا توجد منتجات', 'أضف أول منتج لمتجرك'));
    $('#q').oninput = keepFocus(el, '#q', v => { q = v; draw(); });
    $('#np').onclick = () => open(null); $$('[data-e]', el).forEach(b => b.onclick = () => open(list.find(p => p.id === b.dataset.e)));
    $$('[data-t]', el).forEach(b => b.onclick = async () => { const p = list.find(x => x.id === b.dataset.t), { error: e } = await sb.from('kt_products').update({ active: !p.active }).eq('id', p.id); if (!e) p.active = !p.active; toast(e ? 'تعذر التنفيذ' : 'تم', e ? 'err' : ''); draw(); });
    $$('[data-d]', el).forEach(b => b.onclick = async () => { if (!(await ask('حذف المنتج نهائيًا؟', 'حذف', true))) return; const { error: e } = await sb.from('kt_products').delete().eq('id', b.dataset.d); toast(e ? 'تعذر الحذف (المنتج عليه طلبات)' : 'تم الحذف', e ? 'err' : ''); if (!e) pages.products(el, c); });
  };
  draw();
};

pages.images = async (el, c) => {
  el.innerHTML = pgh('صور المنتجات', 'غيّر الصورة الرئيسية لأي منتج بسرعة') + detailTabs('/store/details/images') + skel(260);
  const { data: list, error } = await OWN(sb.from('kt_products').select('id,name,image,images')).order('name'); if (error) throw error;
  let q = '';
  const draw = () => {
    const rows = list.filter(p => !q || p.name.toLowerCase().includes(q));
    el.innerHTML = pgh('صور المنتجات', `${list.length} منتج`) + detailTabs('/store/details/images') + `<div class="tools"><input class="field" id="q" placeholder="ابحث باسم المنتج" value="${esc(q)}"></div>` +
      (rows.length ? `<div class="grid g4">${rows.map(p => `<article class="card" style="display:grid;gap:10px"><img src="${esc(p.image || '')}" alt="" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:var(--line2)"><b style="font-size:.9rem">${esc(p.name)}</b><p class="hint">${(Array.isArray(p.images) ? p.images : []).length} صورة إضافية</p><label class="btn btn-g btn-sm" style="justify-self:start">${ic('up', 'sm')} تغيير الصورة<input type="file" accept="image/*" data-u="${p.id}" hidden></label></article>`).join('')}</div>` : empty('layers', 'لا توجد منتجات'));
    $('#q').oninput = keepFocus(el, '#q', v => { q = v; draw(); });
    $$('[data-u]', el).forEach(inp => inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return; const p = list.find(x => x.id === inp.dataset.u);
      try { toast('جاري رفع الصورة...'); const url = await uploadImage(f, c.user.id), { error: e } = await sb.from('kt_products').update({ image: url }).eq('id', p.id); if (e) throw e; p.image = url; toast('تم تحديث الصورة'); draw(); }
      catch (e) { toast(e.message || 'تعذر رفع الصورة', 'err'); }
    });
  };
  draw();
};

pages.money = async el => {
  el.innerHTML = pgh('أموال المتجر', 'مبيعات منتجات Kitchenly الخاصة') + detailTabs('/store/details/money') + skel(300);
  const all = (await loadSales(null)).filter(l => !l.store_id), lv = live(all), del = all.filter(l => l.status === 'delivered');
  const days = lastDays(30), byDay = Object.fromEntries(days.map(k => [k, 0])); lv.forEach(l => { const k = dkey(l.created_at); if (k in byDay) byDay[k] += l.total; });
  const orders = groupOrders(lv), open = lv.filter(l => l.status !== 'delivered');
  el.innerHTML = pgh('أموال المتجر', 'مبيعات منتجات Kitchenly الخاصة', `<button class="btn btn-g" id="ex">${ic('dl', 'sm')} تصدير CSV</button>`) + detailTabs('/store/details/money') +
    `<div class="grid g4 keep2">${stat('cash', 'مبيعات مُسلّمة', money(sum(del, l => l.total)), `${groupOrders(del).length} طلب`, 'stat--hl')}${stat('clock', 'قيد التنفيذ', money(sum(open, l => l.total)), `${groupOrders(open).length} طلب`)}${stat('bag', 'كل الطلبات', orders.length)}${stat('trend', 'متوسط الطلب', orders.length ? money(sum(lv, l => l.total) / orders.length) : '-')}</div>
    <div class="card" style="margin-top:16px"><div class="card__head"><h3>المبيعات، آخر 30 يوم</h3><p>بدون الطلبات الملغية</p></div>${areaChart(days, days.map(k => byDay[k]), { unit: 'جنيه' })}</div>
    <div class="card__head" style="margin-top:22px"><h3>آخر الطلبات</h3></div>` +
    tbl(['الطلب', 'التاريخ', 'العميل', 'المبلغ', 'الحالة'], orders.slice(0, 15).map(o => `<tr><td dir="ltr" style="text-align:start"><b>${esc(o.no)}</b></td><td>${date(o.at)}</td><td>${esc(o.name)}</td><td>${money(o.total)}</td><td>${orderBadge(o.status)}</td></tr>`), empty('wallet', 'لا توجد مبيعات بعد'));
  $('#ex').onclick = () => csv('store-sales.csv', [['رقم الطلب', 'التاريخ', 'العميل', 'المبلغ', 'الحالة'], ...orders.map(o => [o.no, dt(o.at), o.name, o.total, o.status])]);
};

/* ======================= فريقي ======================= */
pages.team = async (el, c) => {
  el.innerHTML = pgh('فريقي', 'من يقدر يدخل لوحة فريق العمل') + skel(200);
  const { data, error } = await sb.rpc('kt_team_list'); if (error) throw error;
  const me = (c.user.email || '').toLowerCase();
  el.innerHTML = pgh('فريقي', `${data.length} عضو في الفريق`) +
    `<div class="grid g-main"><div>${tbl(['البريد الإلكتروني', ''], data.map(m => `<tr><td dir="ltr" style="text-align:start"><b>${esc(m.email)}</b>${m.email === me ? ' ' + badge('b-ok', 'أنت') : ''}</td><td class="act">${m.email === me ? '' : `<button class="btn btn-d btn-sm" data-r="${esc(m.email)}">إزالة</button>`}</td></tr>`), empty('users', 'لا يوجد أعضاء'))}</div>
    <form class="card" id="af" style="display:grid;gap:12px;align-self:start" novalidate><h3 style="display:flex;gap:10px;align-items:center">${ico('users')} إضافة عضو</h3>${field('ae', 'البريد الإلكتروني', 'type="email" dir="ltr" required', 'لازم يكون عنده حساب على الموقع بنفس الإيميل')}<p id="err" class="alert" hidden></p><button class="btn btn-p">إضافة</button></form></div>`;
  $('#af').onsubmit = async e => {
    e.preventDefault(); const err = $('#err'), v = $('#ae').value.trim(); err.hidden = true;
    if (!/^\S+@\S+\.\S+$/.test(v)) { err.textContent = 'اكتب بريدًا صحيحًا'; err.hidden = false; return; }
    const { error: x } = await sb.rpc('kt_team_add', { p_email: v }); if (x) { err.textContent = 'تعذر الإضافة'; err.hidden = false; return; }
    toast('تمت الإضافة'); pages.team(el, c);
  };
  $$('[data-r]', el).forEach(b => b.onclick = async () => {
    if (!(await ask(`إزالة ${b.dataset.r} من الفريق؟`, 'إزالة', true))) return;
    const { error: x } = await sb.rpc('kt_team_remove', { p_email: b.dataset.r }); toast(x ? 'تعذرت الإزالة' : 'تمت الإزالة', x ? 'err' : ''); if (!x) pages.team(el, c);
  });
};

/* ======================= التسجيل ======================= */
window.Panel.start({
  base: BASE, home: '/store', loginPath: '/login', brandSub: 'فريق العمل', docTitle: 'فريق العمل',
  aliases: { '/': '/store' },
  nav: [
    { group: 'الدعم' }, { path: '/help-requests', label: 'طلبات المساعدة', icon: 'help' }, { path: '/help-requests/users', label: 'العملاء', sub: true }, { path: '/help-requests/seller', label: 'البائعون', sub: true },
    { group: 'المتجر' }, { path: '/store', label: 'المتجر', icon: 'store' }, { path: '/store/details', label: 'بيانات المتجر', sub: true }, { path: '/store/details/products', label: 'المنتجات', sub: true }, { path: '/store/details/images', label: 'الصور', sub: true }, { path: '/store/details/money', label: 'الأموال', sub: true },
    { group: 'الفريق' }, { path: '/my-team', label: 'فريقي', icon: 'users' }],
  footLinks: [{ href: '/', label: 'العودة للموقع', icon: 'ext' }, { href: '/admin', label: 'لوحة الإدارة', icon: 'gear' }],
  guard, badges, locked: () => '',
  routes: {
    '/login': { public: true, title: 'تسجيل الدخول', view: loginView },
    '/help-requests': { title: 'طلبات المساعدة', view: pages.help }, '/help-requests/users': { title: 'طلبات العملاء', view: pages.helpUsers }, '/help-requests/seller': { title: 'طلبات البائعين', view: pages.helpSeller },
    '/store': { title: 'المتجر', view: pages.store }, '/store/details': { title: 'بيانات المتجر', view: pages.details }, '/store/details/products': { title: 'منتجات المتجر', view: pages.products },
    '/store/details/images': { title: 'صور المنتجات', view: pages.images }, '/store/details/money': { title: 'أموال المتجر', view: pages.money },
    '/my-team': { title: 'فريقي', view: pages.team }
  }
});
})();
