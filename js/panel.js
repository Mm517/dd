/* Kitchenly panels core: واجهة مشتركة للوحة البائع (/be-seller) ولوحة الأدمن (/admin).
   صفحة كاملة مستقلة: مفيش هيدر ولا بحث الموقع. الراوتر بيشتغل بـ History API وقواعد rewrite في vercel.json/_redirects. */
(() => {
'use strict';
const K = window.KT;
/* جلسة اللوحات (بائع / فريق / أدمن) مستقلة تمامًا عن جلسة العميل في المتجر: storageKey مختلف.
   يعني دخول العميل للمتجر لا يفتح اللوحات تلقائيًا، وتسجيل الخروج من اللوحة لا يخرّج العميل من المتجر. */
const sb = window.supabase.createClient(K.url, K.key, { auth: { storageKey: 'kt-panel-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
const signOutLocal = () => sb.auth.signOut({ scope: 'local' });
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const moneyT = n => `${fmt(n)} جنيه`;
const money = n => `<span class="num">${fmt(n)}</span><small> جنيه</small>`;
const date = d => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const dt = d => (d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const rand = (n = 5) => Math.random().toString(36).slice(2, 2 + n);

/* ---------- أيقونات (stroke) ---------- */
const P = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  mega: '<path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2M5 6l11-3 1 3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.7M12 17h.01"/>',
  out: '<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M19 12H9"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  check: '<path d="m5 12 5 5 9-10"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', up: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>', layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>', cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  dl: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>', star: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/>'
};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.box}</svg>`;

/* ---------- واجهة ---------- */
function toast(msg, type = '') {
  let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.setAttribute('role', 'status'); document.body.appendChild(w); }
  const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; w.appendChild(t); setTimeout(() => t.remove(), 3400);
}
function modal(html) {
  const d = document.createElement('dialog'); d.innerHTML = html; document.body.appendChild(d);
  d.addEventListener('close', () => d.remove()); d.addEventListener('click', e => { if (e.target === d) d.close(); }); d.showModal(); return d;
}
const ask = (msg, ok = 'تأكيد', danger = false) => new Promise(res => {
  const d = modal(`<div class="dlg"><h2>${esc(msg)}</h2><div class="dlg__foot"><button class="btn btn-g" data-no>إلغاء</button><button class="btn ${danger ? 'btn-d' : 'btn-p'}" data-yes>${esc(ok)}</button></div></div>`);
  let done = false; d.querySelector('[data-yes]').onclick = () => { done = true; d.close(); res(true); }; d.querySelector('[data-no]').onclick = () => d.close();
  d.addEventListener('close', () => { if (!done) res(false); });
});
const skel = (h = 160) => `<div class="skel" style="height:${h}px"></div>`;
const empty = (icon, title, msg = '', action = '') => `<div class="card empty">${ic(icon)}<h3>${esc(title)}</h3>${msg ? `<p>${esc(msg)}</p>` : ''}${action}</div>`;
const errBox = (m = 'تعذر تحميل البيانات. تأكد من تشغيل ملف SQL على Supabase ثم حاول مرة أخرى.') => `<div class="card empty">${ic('x')}<h3>حصلت مشكلة</h3><p>${esc(m)}</p><button class="btn btn-g" onclick="location.reload()">إعادة المحاولة</button></div>`;
const badge = (cls, t) => `<span class="badge ${cls}">${esc(t)}</span>`;

/* حالات الطلب + المتجر + المنتج + الإعلان */
const ORDER = { new: ['تم استلام الطلب', 'b-blue'], confirmed: ['تم التأكيد', 'b-blue'], shipping: ['في الطريق', 'b-warn'], delivered: ['تم التسليم', 'b-ok'], cancelled: ['ملغي', 'b-red'] };
const orderBadge = s => badge((ORDER[s] || [])[1] || '', (ORDER[s] || [s])[0]);
const STORE = { pending: ['قيد المراجعة', 'b-warn'], approved: ['مفعّل', 'b-ok'], rejected: ['مرفوض', 'b-red'], suspended: ['موقوف', 'b-red'] };
const PROD = { pending: ['قيد المراجعة', 'b-warn'], approved: ['معتمد', 'b-ok'], rejected: ['مرفوض', 'b-red'] };
const AD = { pending: ['قيد المراجعة', 'b-warn'], active: ['نشط', 'b-ok'], paused: ['متوقف', ''], rejected: ['مرفوض', 'b-red'], exhausted: ['انتهت الميزانية', 'b-blue'] };
const sBadge = (map, s) => badge((map[s] || [])[1] || '', (map[s] || [s])[0]);
const PLACE = { home: 'الصفحة الرئيسية', shop: 'صفحة المنتجات', category: 'صفحات الأقسام' };
const GOAL = { sales: 'زيادة المبيعات', awareness: 'التعريف بالمتجر', clearance: 'تصفية مخزون' };

/* ---------- تواريخ ورسوم بيانية (SVG بدون مكتبات) ---------- */
const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const lastDays = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (n - 1 - i)); return dkey(d); });
const dshort = k => new Date(k + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
const nice = m => { if (m <= 0) return 1; const p = 10 ** Math.floor(Math.log10(m)), f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
function areaChart(keys, vals, { color = 'var(--brand)', unit = '' } = {}) {
  const W = 640, H = 220, L = 44, R = 10, T = 12, B = 26, max = nice(Math.max(...vals, 1)), n = keys.length;
  const x = i => L + (n === 1 ? 0 : (i * (W - L - R)) / (n - 1)), y = v => T + (H - T - B) * (1 - v / max);
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const grid = [0, .25, .5, .75, 1].map(f => { const v = max * f, yy = y(v); return `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-dasharray="${f ? '3 4' : ''}"/><text x="${L - 6}" y="${yy + 3}" text-anchor="end">${fmt(v)}</text>`; }).join('');
  const step = Math.ceil(n / 7), xl = keys.map((k, i) => (i % step === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${dshort(k)}</text>` : '')).join('');
  const dots = vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${n > 31 ? 0 : 3}" fill="#fff" stroke="${color}" stroke-width="2"><title>${dshort(keys[i])}: ${fmt(v)} ${unit}</title></circle>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم بياني">${grid}<path d="M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)}Z" fill="${color}" opacity=".12"/><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${dots}${xl}</svg>`;
}
function barChart(items, { color = 'var(--brand)', unit = '' } = {}) {
  const W = 640, H = 200, L = 40, T = 10, B = 26, n = items.length || 1, max = nice(Math.max(...items.map(i => i.v), 1)), bw = (W - L - 10) / n;
  const bars = items.map((it, i) => { const h = (H - T - B) * (it.v / max), xx = L + i * bw + bw * .18; return `<rect x="${xx}" y="${H - B - h}" width="${bw * .64}" height="${Math.max(h, 0)}" rx="4" fill="${color}"><title>${esc(it.l)}: ${fmt(it.v)} ${unit}</title></rect><text x="${xx + bw * .32}" y="${H - 8}" text-anchor="middle">${esc(it.l)}</text>`; }).join('');
  const grid = [0, .5, 1].map(f => { const yy = H - B - (H - T - B) * f; return `<line x1="${L}" x2="${W - 6}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L - 6}" y="${yy + 3}" text-anchor="end">${fmt(max * f)}</text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم بياني">${grid}${bars}</svg>`;
}
const hbars = (rows, f = fmt) => { const m = Math.max(...rows.map(r => r.v), 1); return `<ul class="rows">${rows.map(r => `<li style="display:block"><div style="display:flex;justify-content:space-between;gap:10px"><span>${esc(r.l)}</span><b class="num">${f(r.v)}</b></div><div class="bar" style="margin-top:6px"><i style="width:${(r.v / m) * 100}%"></i></div></li>`).join('')}</ul>`; };
const sum = (a, f) => a.reduce((s, x) => s + (+f(x) || 0), 0);
function csv(name, rows) {
  const b = new Blob(['\ufeff' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- المبيعات (مصدرها دالة kt_sales_lines) ---------- */
async function loadSales(storeId = null) {
  const { data, error } = await sb.rpc('kt_sales_lines', { p_store: storeId }); if (error) throw error;
  return (data || []).map(r => ({ ...r, total: r.qty * r.price }));
}
function groupOrders(lines) {
  const m = new Map();
  lines.forEach(l => { let o = m.get(l.order_id); if (!o) { o = { id: l.order_id, no: l.order_no, at: l.created_at, status: l.status, pay: l.payment_method, name: l.customer_name, phone: l.phone, city: l.city, address: l.address, lines: [], total: 0, stores: new Set() }; m.set(l.order_id, o); } o.lines.push(l); o.total += l.total; o.stores.add(l.store_name || 'Kitchenly'); });
  return [...m.values()].sort((a, b) => new Date(b.at) - new Date(a.at));
}

/* ---------- رفع الصور (Supabase Storage: bucket store-assets) ---------- */
function toBlob(file, max = 1200) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', 0.86); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad_image')); }; img.src = url;
  });
}
async function uploadImage(file, uid) {
  if (!file || !/^image\//.test(file.type)) throw new Error('اختر ملف صورة');
  if (file.size > 12 * 1024 * 1024) throw new Error('الصورة كبيرة، الحد 12 ميجا');
  const blob = await toBlob(file), path = `${uid}/${Date.now()}-${rand(6)}.jpg`;
  const { error } = await sb.storage.from('store-assets').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw new Error('تعذر رفع الصورة. تأكد من تشغيل ملف SQL (bucket: store-assets).');
  return sb.storage.from('store-assets').getPublicUrl(path).data.publicUrl;
}
/* حقل صورة: معاينة + رفع + رابط يدوي */
const imageField = (id, value, label) => `<div><label class="lbl" for="${id}">${label}</label><div class="upl"><img id="${id}-pv" src="${esc(value || '')}" alt="" ${value ? '' : 'style="visibility:hidden"'}><div style="flex:1;display:grid;gap:8px"><input class="field" id="${id}" dir="ltr" placeholder="https://… أو ارفع صورة" value="${esc(value || '')}"><label class="btn btn-g btn-sm" style="justify-self:start">${ic('up', 'sm')} رفع صورة<input type="file" accept="image/*" id="${id}-f" hidden></label></div></div></div>`;
function bindImage(root, id, uid) {
  const inp = $(`#${id}`, root), pv = $(`#${id}-pv`, root), f = $(`#${id}-f`, root);
  const show = () => { pv.src = inp.value; pv.style.visibility = inp.value ? 'visible' : 'hidden'; };
  inp.addEventListener('change', show);
  f.onchange = async () => { const file = f.files[0]; if (!file) return; try { toast('جاري رفع الصورة...'); inp.value = await uploadImage(file, uid); show(); toast('تم رفع الصورة'); } catch (e) { toast(e.message, 'err'); } f.value = ''; };
}

/* ---------- نموذج المنتج (مشترك: البائع + الأدمن) ---------- */
async function productForm({ p, cats, uid, admin = false, store = null, onSaved }) {
  const v = p || { name: '', slug: '', short_desc: '', description: '', features: [], price: '', old_price: '', image: '', images: [], stock: 20, badge: '', featured: false, active: true, category_id: cats[0]?.id };
  const f = (id, label, input, hint = '') => `<div><label class="lbl" for="${id}">${label}</label>${input}${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const d = modal(`<form id="pf" novalidate><h2>${p ? 'تعديل المنتج' : 'منتج جديد'}</h2>
  ${!admin && p && p.approval_status === 'rejected' ? `<p class="alert">تم رفض المنتج${p.reject_reason ? `: ${esc(p.reject_reason)}` : ''}. عدّل ما يلزم وسيعود للمراجعة.</p>` : ''}
  ${!admin ? '<p class="alert alert--info">أي تعديل في الاسم أو الصور أو الوصف يعيد المنتج للمراجعة. تعديل السعر والمخزون فوري.</p>' : ''}
  <div class="fgrid two">${f('f-name', 'اسم المنتج', `<input class="field" id="f-name" maxlength="120" value="${esc(v.name)}" required>`)}
  ${admin ? f('f-slug', 'الرابط (إنجليزي بشرطات)', `<input class="field" id="f-slug" dir="ltr" value="${esc(v.slug)}" ${p ? 'readonly' : ''} placeholder="green-brush">`, 'يظهر في /product/الرابط') : f('f-cat', 'القسم', `<select class="field" id="f-cat">${cats.map(c => `<option value="${c.id}" ${c.id === v.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`)}
  ${admin ? f('f-cat', 'القسم', `<select class="field" id="f-cat">${cats.map(c => `<option value="${c.id}" ${c.id === v.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`) : ''}
  ${f('f-price', 'السعر (جنيه)', `<input class="field" id="f-price" type="number" min="0" step="0.01" value="${v.price}">`)}
  ${f('f-old', 'السعر قبل الخصم', `<input class="field" id="f-old" type="number" min="0" step="0.01" value="${v.old_price ?? ''}">`, 'اتركه فارغًا لو مفيش خصم')}
  ${f('f-stock', 'المخزون', `<input class="field" id="f-stock" type="number" min="0" value="${v.stock}">`)}
  ${admin ? f('f-badge', 'شارة (اختياري)', `<input class="field" id="f-badge" maxlength="20" value="${esc(v.badge || '')}">`) : ''}</div>
  ${imageField('f-img', v.image, 'الصورة الرئيسية')}
  ${f('f-imgs', 'صور إضافية (رابط في كل سطر)', `<textarea class="field" id="f-imgs" dir="ltr" rows="2" placeholder="https://...">${esc((Array.isArray(v.images) ? v.images : []).filter(x => x !== v.image).join('\n'))}</textarea>`)}
  <label class="btn btn-g btn-sm" style="justify-self:start;margin-top:-8px">${ic('up', 'sm')} رفع صور إضافية<input type="file" accept="image/*" multiple id="f-imgs-f" hidden></label>
  ${f('f-short', 'وصف مختصر', `<input class="field" id="f-short" maxlength="120" value="${esc(v.short_desc || '')}">`)}
  ${f('f-desc', 'الوصف', `<textarea class="field" id="f-desc" rows="3">${esc(v.description || '')}</textarea>`)}
  ${f('f-feat', 'المميزات (كل ميزة في سطر)', `<textarea class="field" id="f-feat" rows="3">${esc((v.features || []).join('\n'))}</textarea>`)}
  <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:.9rem"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="f-active" ${v.active ? 'checked' : ''}> ظاهر في المتجر</label>${admin ? `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="f-featured" ${v.featured ? 'checked' : ''}> الأكثر مبيعًا</label>` : ''}</div>
  <p id="f-err" class="alert" role="alert" hidden></p>
  <div class="dlg__foot"><button type="button" class="btn btn-g" id="f-cancel">إلغاء</button><button class="btn btn-p" id="f-save">${p ? 'حفظ التعديلات' : admin ? 'حفظ' : 'إرسال للمراجعة'}</button></div></form>`);
  bindImage(d, 'f-img', uid);
  $('#f-imgs-f', d).onchange = async e => { const ta = $('#f-imgs', d); for (const file of e.target.files) { try { const u = await uploadImage(file, uid); ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + u; } catch (er) { toast(er.message, 'err'); } } e.target.value = ''; };
  $('#f-cancel', d).onclick = () => d.close();
  $('#pf', d).addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#f-err', d), show = m => { err.textContent = m; err.hidden = false; };
    const main = $('#f-img', d).value.trim();
    const row = { name: $('#f-name', d).value.trim(), category_id: $('#f-cat', d).value, image: main, price: Number($('#f-price', d).value), old_price: $('#f-old', d).value === '' ? null : Number($('#f-old', d).value), stock: parseInt($('#f-stock', d).value, 10), short_desc: $('#f-short', d).value.trim(), description: $('#f-desc', d).value.trim(), features: $('#f-feat', d).value.split('\n').map(s => s.trim()).filter(Boolean), images: [...new Set([main, ...$('#f-imgs', d).value.split('\n').map(s => s.trim()).filter(Boolean)].filter(Boolean))], active: $('#f-active', d).checked };
    if (admin) { row.slug = $('#f-slug', d).value.trim(); row.badge = $('#f-badge', d).value.trim() || null; row.featured = $('#f-featured', d).checked; }
    else if (!p) row.slug = `${store?.slug || 'shop'}-${rand(6)}`;
    if (!row.name) return show('اكتب اسم المنتج');
    if (!SLUG.test(row.slug || (p && p.slug) || '')) return show('الرابط يجب أن يكون حروفًا إنجليزية صغيرة وأرقامًا مفصولة بشرطات');
    if (!(row.price >= 0) || $('#f-price', d).value === '') return show('اكتب سعرًا صحيحًا');
    if (row.old_price !== null && row.old_price <= row.price) return show('السعر قبل الخصم لازم يكون أكبر من السعر الحالي');
    if (!Number.isInteger(row.stock) || row.stock < 0) return show('اكتب مخزونًا صحيحًا');
    if (!row.image) return show('أضف صورة رئيسية للمنتج');
    if (!row.description || row.description.length < 10) return show('اكتب وصفًا للمنتج (10 حروف على الأقل)');
    const btn = $('#f-save', d); btn.disabled = true;
    const { error } = p ? await sb.from('kt_products').update(row).eq('id', p.id) : await sb.from('kt_products').insert(row);
    btn.disabled = false;
    if (error) return show(error.code === '23505' ? 'هذا الرابط مستخدم لمنتج آخر' : error.message?.includes('store_not_approved') ? 'متجرك لم يتم تفعيله بعد' : 'تعذر حفظ المنتج');
    d.close(); toast(admin || p ? 'تم الحفظ' : 'تم إرسال المنتج للمراجعة'); onSaved && onSaved();
  });
}


/* ---------- تحميل تدريجي: دفعة صغيرة كل مرة (بدل تحميل كل البيانات) ---------- */
/* fetchPage(offset, size) => { rows, total } ; renderRows(rows, first) يضيف العناصر في الحاوية ؛ بيرجّع { reload, stop } */
function pager(host, { size = 20, fetchPage, renderRows, emptyHtml = '', onTotal }) {
  let offset = 0, busy = false, done = false, gen = 0, io = null;
  host.innerHTML = '<div data-rows></div><div data-more style="text-align:center;padding:14px"></div>';
  const rowsEl = host.querySelector('[data-rows]'), more = host.querySelector('[data-more]');
  const setMore = (state) => {
    if (state === 'loading') more.innerHTML = '<span style="color:var(--muted);font-size:.88rem">جاري التحميل...</span>';
    else if (state === 'more') { more.innerHTML = '<button class="btn btn-g" data-m>عرض المزيد</button>'; more.querySelector('[data-m]').onclick = load; }
    else if (state === 'error') { more.innerHTML = '<button class="btn btn-g" data-m>تعذر التحميل، أعد المحاولة</button>'; more.querySelector('[data-m]').onclick = load; }
    else more.innerHTML = '';
  };
  async function load() {
    if (busy || done) return; busy = true; const g = gen; setMore('loading');
    try {
      const { rows, total } = await fetchPage(offset, size);
      if (g !== gen) return;
      if (offset === 0) { onTotal && onTotal(total); if (!rows.length) { rowsEl.innerHTML = emptyHtml; done = true; setMore(''); busy = false; return; } }
      renderRows(rows, offset === 0, rowsEl); offset += rows.length;
      done = rows.length < size || (total != null && offset >= total);
      setMore(done ? '' : 'more');
    } catch (e) { console.error(e); if (g === gen) { if (offset === 0) { rowsEl.innerHTML = errBox(); setMore(''); done = true; } else setMore('error'); } }
    busy = false;
  }
  if ('IntersectionObserver' in window) { io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting) && offset > 0) load(); }, { rootMargin: '300px' }); io.observe(more); }
  const reload = () => { gen++; offset = 0; done = false; busy = false; rowsEl.innerHTML = skel(180); load(); };
  reload();
  return { reload, stop: () => { gen++; io && io.disconnect(); } };
}
const debounce = (fn, ms = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
/* تنظيف نص البحث قبل استخدامه في فلتر PostgREST (or/ilike) */
const qClean = q => String(q || '').replace(/[,()%*\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);


/* ---------- هوية صفحة الدخول (الجنب): أيقونة + كتشنلي + خط مايل تحتها ---------- */
const authBrand = role => `<div class="auth__brand"><img src="/assets/img/logo-mark.jpg" alt="" width="56" height="56"><div class="auth__word"><b>كتشنلي</b><i class="auth__slash" aria-hidden="true"></i><small>KITCHENLY${role ? ` · ${esc(role)}` : ''}</small></div></div>`;

/* ---------- دخول / إنشاء حساب للوحات الفريق والأدمن (صفحة خارجية بحساب مستقل) ----------
   الدخول مسموح فقط لو الإيميل ضمن kt_admins (kt_is_admin). الإنشاء بإيميل جديد أو بنفس إيميل حسابك في المتجر. */
function staffAuth(root, { role, title, sub, bullets = [], art, back = '/', onDone, check }) {
  let mode = 'login', pending = '', pwd = '', prefill = '';
  const errTxt = e => { const m = String(e?.message || e || ''); return /Invalid login/i.test(m) ? 'الإيميل أو كلمة المرور غير صحيحة' : /not confirmed/i.test(m) ? 'الحساب لم يتم تأكيده بعد، سجّل من جديد ليصلك كود' : /rate|too many|seconds/i.test(m) ? 'محاولات كثيرة، انتظر قليلًا ثم حاول مرة أخرى' : /expired|invalid.*(token|otp)|Token/i.test(m) ? 'الكود غير صحيح أو انتهت صلاحيته' : /password/i.test(m) ? 'كلمة المرور ضعيفة (8 حروف على الأقل)' : 'حدث خطأ، حاول مرة أخرى'; };
  const fld = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const layout = inner => `<div class="auth"><section class="auth__art">${authBrand(role)}<div><h2>${esc(title)}</h2>${bullets.length ? `<ul>${bullets.map(([i, t]) => `<li>${ic(i)}<span>${esc(t)}</span></li>`).join('')}</ul>` : ''}${art ? `<img src="${art}" alt="" width="300" height="300" style="margin-top:20px;width:min(300px,70%);height:auto;border-radius:20px;background:#fff">` : ''}</div><p style="opacity:.6;font-size:.85rem">© Kitchenly ${new Date().getFullYear()}</p></section><section class="auth__form"><div class="auth__box">${inner}</div></section></div>`;
  const show = (m, ok) => { const e = $('#err'); e.textContent = m; e.className = ok ? 'alert alert--ok' : 'alert'; e.hidden = false; };
  const finish = async () => { const c = await check(); if (c === true) return onDone(); await signOutLocal(); mode = 'login'; draw(); show(c || 'هذا الحساب غير مصرّح له بدخول هذه اللوحة'); };
  const tabs = () => `<div class="tabs" style="margin-bottom:0"><button type="button" data-md="login" aria-current="${mode === 'login'}">دخول</button><button type="button" data-md="signup" aria-current="${mode === 'signup'}">إنشاء حساب</button></div>`;
  async function draw() {
    if (mode === 'verify') {
      root.innerHTML = layout(`<div><h1>أدخل كود التأكيد</h1><p>أرسلنا كودًا إلى <b dir="ltr">${esc(pending)}</b></p></div><form id="f" class="fgrid" novalidate>${fld('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="------"').replace('class="field"', 'class="field code-in"')}<p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="b">تأكيد</button></form><p style="text-align:center;font-size:.9rem;display:flex;gap:14px;justify-content:center"><button class="link-b" id="rs">أعد إرسال الكود</button><button class="link-b" id="back">رجوع</button></p>`);
      $('#back').onclick = () => { mode = 'signup'; draw(); };
      $('#rs').onclick = async () => { const { error } = await sb.auth.resend({ type: 'signup', email: pending }); toast(error ? errTxt(error) : 'تم إرسال كود جديد', error ? 'err' : ''); };
      $('#f').onsubmit = async e => { e.preventDefault(); const t = $('#code').value.replace(/\D/g, ''); $('#err').hidden = true; if (t.length < 6) return show('اكتب الكود كاملًا'); $('#b').disabled = true; const { error } = await sb.auth.verifyOtp({ email: pending, token: t, type: 'signup' }); $('#b').disabled = false; if (error) return show(errTxt(error)); finish(); };
      return;
    }
    if (mode === 'signup') {
      root.innerHTML = layout(`<div><h1>إنشاء حساب ${esc(role)}</h1><p>${esc(sub)} الحساب هنا مستقل عن حساب المتجر، وتقدر تستخدم نفس إيميلك أو إيميل آخر.</p></div>${tabs()}<form id="f" class="fgrid" novalidate>${fld('nm', 'اسمك', 'maxlength="80" autocomplete="name"')}${fld('em', 'البريد الإلكتروني', `type="email" dir="ltr" autocomplete="email" value="${esc(prefill)}"`)}${fld('pw', 'كلمة المرور', 'type="password" dir="ltr" minlength="8" autocomplete="new-password"', '8 حروف على الأقل')}<p id="err" class="alert" role="alert" hidden></p><div id="ex" hidden style="display:flex;gap:8px;flex-wrap:wrap"></div><button class="btn btn-p btn-block" id="b">إنشاء الحساب</button></form><p style="text-align:center"><a class="link-b" href="${back}">العودة للموقع</a></p>`);
      $$('[data-md]').forEach(b => b.onclick = () => { mode = b.dataset.md; draw(); });
      $('#f').onsubmit = async e => {
        e.preventDefault(); $('#err').hidden = true; $('#ex').hidden = true;
        const name = $('#nm').value.trim(), email = $('#em').value.trim(), pw = $('#pw').value;
        if (name.length < 2) return show('اكتب اسمك'); if (!/^\S+@\S+\.\S+$/.test(email)) return show('اكتب بريدًا صحيحًا'); if (pw.length < 8) return show('كلمة المرور 8 حروف على الأقل');
        $('#b').disabled = true; const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { name } } }); $('#b').disabled = false;
        if (error) return show(errTxt(error));
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          show('الإيميل ده عليه حساب بالفعل (غالبًا حساب المتجر). سجّل دخولك بنفس الإيميل وكلمة مرور حسابه، أو اكتب إيميل آخر.');
          const ex = $('#ex'); ex.hidden = false; ex.innerHTML = '<button type="button" class="btn btn-g btn-sm" id="use">استخدم نفس الإيميل (دخول)</button><button type="button" class="btn btn-g btn-sm" id="other">إيميل آخر</button>';
          $('#use').onclick = () => { prefill = email; mode = 'login'; draw(); };
          $('#other').onclick = () => { $('#em').value = ''; $('#em').focus(); ex.hidden = true; $('#err').hidden = true; };
          return;
        }
        pending = email; if (data.session) return finish(); mode = 'verify'; draw();
      };
      return;
    }
    const otp = mode === 'otp';
    root.innerHTML = layout(`<div><h1>دخول ${esc(role)}</h1><p>${esc(sub)}</p></div>${tabs()}<form id="f" class="fgrid" novalidate>${fld('em', 'البريد الإلكتروني', `type="email" dir="ltr" autocomplete="email" value="${esc(prefill)}"`)}${otp ? '' : fld('pw', 'كلمة المرور', 'type="password" dir="ltr" autocomplete="current-password"')}<p id="err" class="alert" role="alert" hidden></p><button class="btn btn-p btn-block" id="b">${otp ? 'أرسل لي كود الدخول' : 'دخول'}</button></form><p style="text-align:center;font-size:.9rem"><button class="link-b" id="sw">${otp ? 'الدخول بكلمة المرور' : 'الدخول بكود يصلك على الإيميل'}</button></p><p style="text-align:center"><a class="link-b" href="${back}">العودة للموقع</a></p>`);
    $$('[data-md]').forEach(b => b.onclick = () => { mode = b.dataset.md; draw(); });
    $('#sw').onclick = () => { mode = otp ? 'login' : 'otp'; draw(); };
    $('#f').onsubmit = async e => {
      e.preventDefault(); $('#err').hidden = true; const email = $('#em').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return show('اكتب بريدًا صحيحًا');
      $('#b').disabled = true;
      if (otp) { const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }); $('#b').disabled = false; if (error) return show(errTxt(error)); pending = email; mode = 'otpverify'; return drawOtp(); }
      const { error } = await sb.auth.signInWithPassword({ email, password: $('#pw').value }); $('#b').disabled = false;
      if (error) return show(errTxt(error)); finish();
    };
  }
  function drawOtp() {
    root.innerHTML = layout(`<div><h1>أدخل كود الدخول</h1><p>أرسلنا كودًا إلى <b dir="ltr">${esc(pending)}</b></p></div><form id="f" class="fgrid" novalidate>${fld('code', 'الكود', 'inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="------"').replace('class="field"', 'class="field code-in"')}<p id="err" class="alert" hidden></p><button class="btn btn-p btn-block" id="b">تأكيد</button></form><p style="text-align:center"><button class="link-b" id="back">رجوع</button></p>`);
    $('#back').onclick = () => { mode = 'otp'; draw(); };
    $('#f').onsubmit = async e => { e.preventDefault(); const t = $('#code').value.replace(/\D/g, ''); $('#err').hidden = true; if (t.length < 6) return show('اكتب الكود كاملًا'); $('#b').disabled = true; const { error } = await sb.auth.verifyOtp({ email: pending, token: t, type: 'email' }); $('#b').disabled = false; if (error) return show(errTxt(error)); finish(); };
  }
  draw();
}

/* ---------- الراوتر والهيكل ---------- */
let CFG = null, CTX = null, shellOn = false;
const rel = () => { const p = location.pathname.replace(/\/+$/, '') || '/'; return p === CFG.base ? '/' : p.startsWith(CFG.base + '/') ? p.slice(CFG.base.length) : '/'; };
const canon = r => (CFG.aliases && CFG.aliases[r]) || r;
function go(href, replace = false) { history[replace ? 'replaceState' : 'pushState'](null, '', href); return render(); }
const nextUrl = () => { const n = new URLSearchParams(location.search).get('next'); return n && n.startsWith(CFG.base) ? n : CFG.base + CFG.home; };

function shellHtml(ctx) {
  const items = CFG.nav.map(n => n.group ? `<p class="side__grp">${esc(n.group)}</p>` : `<a data-l href="${CFG.base}${n.path === '/' ? '' : n.path}" data-path="${n.path}" class="${n.sub ? 'sub' : ''}">${n.sub ? '' : ic(n.icon)}<span>${esc(n.label)}</span><b class="cnt" data-cnt="${n.path}" hidden></b></a>`).join('');
  const nm = ctx.name || ctx.user?.email || '';
  return `<div class="shell"><aside class="side" id="side"><a data-l href="${CFG.base}${CFG.home === '/' ? '' : CFG.home}" class="side__brand"><img src="/assets/img/logo-mark.jpg" alt=""><span>KITCHENLY<small>${esc(CFG.brandSub)}</small></span></a><nav aria-label="القائمة">${items}</nav>
  <div class="side__foot">${CFG.footLinks.map(l => `<a href="${l.href}" ${l.href.startsWith('http') ? '' : 'target="_blank" rel="noopener"'}>${ic(l.icon, 'sm')}<span>${esc(l.label)}</span></a>`).join('')}<button id="signout">${ic('out', 'sm')}<span>تسجيل الخروج</span></button></div></aside>
  <div class="scrim" id="scrim"></div>
  <div class="main"><header class="top"><button class="burger" id="burger" aria-label="القائمة">${ic('menu')}</button><h1 id="ptitle"></h1><span class="top__sp"></span>${CFG.topExtra ? CFG.topExtra(ctx) : ''}<div class="me"><span class="me__av">${esc(nm.trim().charAt(0).toUpperCase() || 'K')}</span><div><b>${esc(ctx.name || 'حسابي')}</b><small dir="ltr">${esc(ctx.user?.email || '')}</small></div></div></header>
  <main class="content" id="view"></main></div></div>`;
}
const applyBadges = ctx => { if (CFG.badges) CFG.badges(ctx).then(b => Object.entries(b || {}).forEach(([k, n]) => { const el = $(`[data-cnt="${k}"]`); if (!el) return; el.textContent = n; el.hidden = !(n > 0); })).catch(() => {}); };
function ensureShell(ctx) {
  if (!shellOn) {
    $('#root').innerHTML = shellHtml(ctx); shellOn = true;
    const close = () => document.body.classList.remove('nav-open');
    $('#burger').onclick = () => document.body.classList.toggle('nav-open'); $('#scrim').onclick = close;
    $('#signout').onclick = async () => { await signOutLocal(); shellOn = false; CTX = null; location.href = CFG.base + CFG.loginPath; };
  }
  applyBadges(ctx);
  document.body.classList.remove('nav-open');
}
async function render() {
  let key = canon(rel()), route = CFG.routes[key], params = {};
  if (!route && CFG.patterns) for (const [rx, r] of CFG.patterns) { const m = key.match(rx); if (m) { route = r; params = { m, key }; break; } }
  window.scrollTo(0, 0);
  if (route && CFG.aliases && CFG.aliases[rel()] && !params.m) history.replaceState(null, '', CFG.base + key);
  if (!route) return go(CFG.base + CFG.home, true);
  if (route.public) {
    shellOn = false; document.body.classList.remove('nav-open'); document.title = `${route.title} | Kitchenly`;
    return route.view($('#root'), { next: nextUrl(), go });
  }
  const ctx = await CFG.guard({ go, sb, nextUrl });
  if (!ctx) { shellOn = false; return; }
  CTX = ctx; ensureShell(ctx);
  const paths = CFG.nav.filter(n => n.path).map(n => n.path), best = route.nav || paths.filter(p => key === p || (p !== '/' && key.startsWith(p + '/'))).sort((a, b) => b.length - a.length)[0];
  $$('.side nav a').forEach(a => { if (a.dataset.path === best) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#ptitle').textContent = route.title; document.title = `${route.title} | ${CFG.docTitle}`;
  const oldV = $('#view'), view = oldV.cloneNode(false); oldV.replaceWith(view); view.innerHTML = skel(220); /* عنصر جديد كل مرة: يمنع تراكم مستمعات الأحداث */
  if (route.needs && !route.needs(ctx)) { view.innerHTML = CFG.locked(ctx); return; }
  try { await route.view(view, ctx, params); } catch (e) { console.error(e); view.innerHTML = errBox(); }
}
function start(cfg) {
  CFG = cfg;
  document.addEventListener('click', e => { const a = e.target.closest('a[data-l]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); go(a.getAttribute('href')); });
  window.addEventListener('popstate', render);
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
}

window.Panel = { sb, K, signOutLocal, refreshBadges: () => CTX && applyBadges(CTX), pager, debounce, qClean, authBrand, staffAuth, $, $$, esc, fmt, money, moneyT, date, dt, ic, toast, modal, ask, skel, empty, errBox, badge, ORDER, STORE, PROD, AD, PLACE, GOAL, orderBadge, sBadge, areaChart, barChart, hbars, lastDays, dkey, dshort, sum, csv, loadSales, groupOrders, uploadImage, imageField, bindImage, productForm, SLUG, rand, go, start, refresh: render };
})();
