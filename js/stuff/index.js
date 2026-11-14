/* =====================================================================
 * js/stuff/index.js
 * الوظيفة: تسجيل لوحة الفريق في الراوتر (Panel.start).
 * يعتمد على: js/stuff/shared.js [BASE, pages] · js/stuff/auth.js [loginView, guard, badges]
 * يعرض على window.Panel.stuff: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.stuff = window.Panel.stuff || {});
const { BASE, pages } = NS;   // js/stuff/shared.js
const { loginView, guard, badges } = NS;   // js/stuff/auth.js

/* ===================== #stuff-start: تسجيل اللوحة في الراوتر ===================== */
// #stuff #router #bootstrap
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
