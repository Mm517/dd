/* =====================================================================
 * js/seller/shared.js
 * الوظيفة: ثوابت وأدوات مشتركة بين صفحات لوحة البائع (محافظات، أنواع النشاط، حقول، جداول) وسجل الصفحات (pages).
 * يعتمد على: window.Panel [sb, esc, ic]
 * يعرض على window.Panel.seller: BASE, GOVS, BTYPES, errMsg, field, sel, tbl, balance, stat, live, approved, pgh, pages
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { sb, esc, ic } = window.Panel;

/* ===================== #seller-shared: ثوابت وأدوات مشتركة ===================== */
// #seller #shared #helpers #forms #tables
const BASE = '/be-seller';
const GOVS = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'الشرقية', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'];
const BTYPES = ['أدوات تنظيف', 'أدوات مطبخ', 'منظمات وتخزين', 'أجهزة منزلية صغيرة', 'مصنع / مورّد جملة', 'أخرى'];
const errMsg = e => { const m = String(e?.message || e || ''); return /Invalid login/i.test(m) ? 'الإيميل أو كلمة المرور غير صحيحة' : /not confirmed/i.test(m) ? 'الحساب لم يتم تأكيده بعد، اطلب كود جديد' : /already|registered/i.test(m) ? 'هذا الإيميل مسجّل بالفعل، سجّل دخولك' : /rate|too many|seconds/i.test(m) ? 'محاولات كثيرة، انتظر قليلًا ثم حاول مرة أخرى' : /expired|invalid.*(token|otp)|Token/i.test(m) ? 'الكود غير صحيح أو انتهت صلاحيته' : /password/i.test(m) ? 'كلمة المرور ضعيفة (8 حروف على الأقل)' : 'حدث خطأ، حاول مرة أخرى'; };
const field = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
const sel = (id, label, opts, val = '', ph = '') => `<div><label class="lbl" for="${id}">${label}</label><select class="field" id="${id}">${ph ? `<option value="">${ph}</option>` : ''}${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select></div>`;
const tbl = (head, rows, empt) => rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empt;
const balance = async id => { const { data, error } = await sb.rpc('kt_store_balance', { p_store: id }); if (error) throw error; return data?.[0] || { gross: 0, commission: 0, net: 0, paid: 0, pending: 0, ad_spent: 0, ad_credit: 0, available: 0 }; };
const stat = (icon, label, val, d = '', cls = '') => `<div class="card stat ${cls}"><div class="stat__l">${ic(icon)}${label}</div><div class="stat__v">${val}</div>${d ? `<div class="stat__d">${d}</div>` : ''}</div>`;
const live = l => l.filter(x => x.status !== 'cancelled');
const approved = c => c.store.status === 'approved';
const pgh = (t, s, act = '') => `<div class="pgh"><div><h2>${t}</h2>${s ? `<p>${s}</p>` : ''}</div><div>${act}</div></div>`;

/* ===================== #seller-pages: سجل صفحات اللوحة ===================== */
// #seller #pages-registry
const pages = {};

Object.assign(NS, { BASE, GOVS, BTYPES, errMsg, field, sel, tbl, balance, stat, live, approved, pgh, pages });
})();
