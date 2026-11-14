/* =====================================================================
 * js/stuff/store.js
 * الوظيفة: متجر Kitchenly نفسه: البيانات والمنتجات والصور والأموال.
 * يعتمد على: js/stuff/shared.js [K, BASE, pgh, stat, tbl, ico, live, keepFocus, pages] · window.Panel [sb, $, $$, esc, fmt, money, moneyT, date, dt, ic, toast, ask, skel, empty, badge, orderBadge, areaChart, lastDays, dkey, sum, csv, loadSales, groupOrders, uploadImage, productForm]
 * يعرض على window.Panel.stuff: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.stuff = window.Panel.stuff || {});
const { sb, $, $$, esc, fmt, money, moneyT, date, dt, ic, toast, ask, skel, empty, badge, orderBadge, areaChart, lastDays, dkey, sum, csv, loadSales, groupOrders, uploadImage, productForm } = window.Panel;
const { K, BASE, pgh, stat, tbl, ico, live, keepFocus, pages } = NS;   // js/stuff/shared.js

/* ===================== #stuff-store: المتجر (بيانات، منتجات، صور، أموال) ===================== */
// #stuff #store #details #products #images #money
const OWN = q => q.is('store_id', null);
const detailTabs = cur => `<div class="tabs">${[['/store/details', 'بيانات المتجر'], ['/store/details/products', 'المنتجات'], ['/store/details/images', 'الصور'], ['/store/details/money', 'الأموال']].map(([p, t]) => `<a data-l href="${BASE}${p}" aria-current="${cur === p}">${t}</a>`).join('')}</div>`;

// #page-store #route #stuff #store
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

// #page-details #route #stuff #store
pages.details = async el => {
  const { data: cats } = await sb.from('kt_categories').select('id').limit(50);
  el.innerHTML = pgh('بيانات المتجر', 'إعدادات Kitchenly الحالية (للقراءة، تتعدل من config.js)') + detailTabs('/store/details') +
    `<div class="grid g2"><div class="card"><div class="card__head"><h3>المتجر</h3></div><dl class="kv"><dt>الاسم</dt><dd>Kitchenly</dd><dt>الأقسام</dt><dd>${(cats || []).length}</dd><dt>رابط المتجر</dt><dd dir="ltr" style="text-align:start"><a class="btn-link" href="/" target="_blank" rel="noopener">${esc(location.origin)}</a></dd></dl></div>
    <div class="card"><div class="card__head"><h3>الشحن والتواصل</h3></div><dl class="kv"><dt>رسوم الشحن</dt><dd>${moneyT(K.shippingFee)}</dd><dt>شحن مجاني فوق</dt><dd>${moneyT(K.freeShipFrom)}</dd><dt>الهاتف</dt><dd dir="ltr" style="text-align:start">${esc(K.phone)}</dd><dt>واتساب</dt><dd dir="ltr" style="text-align:start">${esc(K.whatsapp)}</dd></dl></div></div>`;
};

// #page-products #route #stuff #store
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

// #page-images #route #stuff #store
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

// #page-money #route #stuff #store
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
})();
