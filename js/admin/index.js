/* =====================================================================
 * js/admin/index.js
 * الوظيفة: تسجيل لوحة الأدمن في الراوتر (Panel.start): المسارات والقوائم والحماية.
 * يعتمد على: js/admin/shared.js [BASE, pages] · js/admin/auth.js [guard, badges]
 * يعرض على window.Panel.admin: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { BASE, pages } = NS;   // js/admin/shared.js
const { guard, badges } = NS;   // js/admin/auth.js

/* ===================== #admin-start: تسجيل اللوحة في الراوتر ===================== */
// #admin #router #bootstrap
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
