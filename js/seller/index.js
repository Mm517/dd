/* =====================================================================
 * js/seller/index.js
 * الوظيفة: تسجيل لوحة البائع في الراوتر (Panel.start).
 * يعتمد على: js/seller/shared.js [BASE, approved, pages] · js/seller/auth.js [loginView, signupView, guard, locked] · window.Panel [esc, ic, badge, STORE]
 * يعرض على window.Panel.seller: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.seller = window.Panel.seller || {});
const { esc, ic, badge, STORE } = window.Panel;
const { BASE, approved, pages } = NS;   // js/seller/shared.js
const { loginView, signupView, guard, locked } = NS;   // js/seller/auth.js
const { PREM, isPremium, premiumLocked } = NS;   // js/seller/premium.js
const needsPrem = c => approved(c) && isPremium(c);

/* ===================== #seller-start: تسجيل اللوحة في الراوتر ===================== */
// #seller #router #bootstrap
window.Panel.start({
  base: BASE, home: '/dashboard', loginPath: '/login', brandSub: 'لوحة البائع', docTitle: 'لوحة البائع',
  aliases: { '/': '/dashboard', '/dashboard/analytics': '/dashboard/analystics', '/dashboard/campaigns': '/dashboard/campings', '/dashboard/campaigns/ads': '/dashboard/campings/ads' },
  nav: [
    { path: '/dashboard', label: 'نظرة عامة', icon: 'home' }, { group: 'المبيعات' },
    { path: '/dashboard/orders', label: 'الطلبات', icon: 'bag' }, { path: '/dashboard/products', label: 'المنتجات', icon: 'box' }, { path: '/dashboard/payouts', label: 'المدفوعات', icon: 'wallet' }, { group: 'النمو' },
    { path: '/dashboard/analystics', label: 'التحليلات', icon: 'chart' }, { path: '/dashboard/campings', label: 'الحملات', icon: 'mega' }, { path: '/dashboard/campings/ads', label: 'الإعلانات', sub: true }, { group: 'المتجر' },
    { path: '/dashboard/store', label: 'بيانات المتجر', icon: 'store' }, { path: '/dashboard/settings', label: 'الإعدادات', icon: 'gear' }, { path: '/dashboard/help', label: 'المساعدة', icon: 'help' }, { group: 'بريميوم' },
    { path: '/premuim/code-entering', label: 'تفعيل البريميوم', icon: 'crown' }, { path: '/premuim/build-ownstore', label: 'ابنِ متجرك', icon: 'layers' },
    { path: '/premuim/premuim-own-templat/templates', label: 'القوالب الجاهزة', sub: true }, { path: '/premuim/build-ownstore/code-yo', label: 'بالكود', sub: true }],
  footLinks: [{ href: '/', label: 'العودة للموقع', icon: 'ext' }],
  topExtra: c => (c.store.status === 'approved' ? `<a class="btn btn-g btn-sm" href="/store/${esc(c.store.slug)}" target="_blank" rel="noopener">${ic('ext', 'sm')} <span>صفحة متجري</span></a>` : badge(STORE[c.store.status][1], STORE[c.store.status][0])),
  guard, locked: c => (approved(c) ? premiumLocked(c) : locked(c)),
  routes: {
    '/login': { public: true, title: 'تسجيل الدخول', view: loginView }, '/signup': { public: true, title: 'حساب بائع جديد', view: signupView },
    '/dashboard': { title: 'نظرة عامة', view: pages.overview }, '/dashboard/orders': { title: 'الطلبات', view: pages.orders, needs: approved }, '/dashboard/products': { title: 'المنتجات', view: pages.products, needs: approved },
    '/dashboard/payouts': { title: 'المدفوعات', view: pages.payouts, needs: approved }, '/dashboard/analystics': { title: 'التحليلات', view: pages.analytics, needs: approved },
    '/dashboard/campings': { title: 'الحملات', view: pages.campaigns, needs: approved }, '/dashboard/campings/ads': { title: 'الإعلانات', view: pages.ads, needs: approved },
    '/dashboard/store': { title: 'بيانات المتجر', view: pages.store }, '/dashboard/settings': { title: 'الإعدادات', view: pages.settings }, '/dashboard/help': { title: 'المساعدة', view: pages.help },
    /* البريميوم: التفعيل يحتاج متجر معتمد فقط، والباقي يحتاج بريميوم شغّال */
    '/premuim/code-entering': { title: 'تفعيل البريميوم', view: pages.premCode, needs: approved },
    '/premuim/build-ownstore': { title: 'ابنِ متجرك', view: pages.premBuild, needs: needsPrem },
    '/premuim/build-ownstore/template': { title: 'قالب جاهز', view: pages.premTemplate, needs: needsPrem },
    '/premuim/build-ownstore/code-yo': { title: 'بناء المتجر بالكود', view: pages.premCodeYo, needs: needsPrem },
    '/premuim/build-ownstore/code-yo/write-and-create': { title: 'اكتب وأنشئ', view: pages.premWrite, needs: needsPrem },
    '/premuim/build-ownstore/code-yo/upload': { title: 'ارفع ملفاتك', view: pages.premUpload, needs: needsPrem },
    '/premuim/premuim-own-templat/templates': { title: 'القوالب الجاهزة', view: pages.premTemplates, needs: needsPrem },
    '/premuim/template-sdeded/edit': { title: 'تعديل القالب', view: pages.premEdit, needs: needsPrem, nav: '/premuim/premuim-own-templat/templates' }
  }
});
})();
