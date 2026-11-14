/* =====================================================================
 * js/admin/orders.js
 * الوظيفة: الطلبات: قوائم الحالات (جديدة/مؤكدة/في الطريق...) وصفحة تفاصيل الطلب.
 * يعتمد على: js/admin/shared.js [BASE, pgh, pages] · window.Panel [sb, $, esc, fmt, money, moneyT, dt, ic, toast, ask, empty, orderBadge, ORDER, sum, csv]
 * يعرض على window.Panel.admin: waNum
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, esc, fmt, money, moneyT, dt, ic, toast, ask, empty, orderBadge, ORDER, sum, csv } = window.Panel;
const { BASE, pgh, pages } = NS;   // js/admin/shared.js

/* ===================== #admin-orders: الطلبات وصفحة تفاصيل الطلب ===================== */
// #admin #orders #order-details #whatsapp
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
// #page-order-details #route #admin #orders
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

Object.assign(NS, { waNum });
})();
