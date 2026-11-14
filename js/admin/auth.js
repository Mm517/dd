/* =====================================================================
 * js/admin/auth.js
 * الوظيفة: حماية لوحة الأدمن: التحقق من الصلاحية (kt_is_admin) وشاشة الدخول وعدّادات الشارات.
 * يعتمد على: js/admin/shared.js [count] · window.Panel [sb, $, esc, ic]
 * يعرض على window.Panel.admin: guard, badges
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, esc, ic } = window.Panel;
const { count } = NS;   // js/admin/shared.js

/* ===================== #admin-auth: الحماية والدخول (حساب مستقل) ===================== */
// #admin #auth #guard #login #badges
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

Object.assign(NS, { guard, badges });
})();
