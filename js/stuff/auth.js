/* =====================================================================
 * js/stuff/auth.js
 * الوظيفة: دخول الفريق وحماية اللوحة وعدّادات الشارات.
 * يعتمد على: js/stuff/shared.js [BASE, isSeller] · window.Panel [sb]
 * يعرض على window.Panel.stuff: loginView, guard, badges
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.stuff = window.Panel.stuff || {});
const { sb } = window.Panel;
const { BASE, isSeller } = NS;   // js/stuff/shared.js

/* ===================== #stuff-auth: الدخول والحماية ===================== */
// #stuff #auth #login #guard #badges
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

Object.assign(NS, { loginView, guard, badges });
})();
