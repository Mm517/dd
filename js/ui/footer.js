/* =====================================================================
 * js/ui/footer.js
 * الوظيفة: شريط التبويبات السفلي للموبايل والفوتر.
 * يعتمد على: js/core/utils.js [$, esc, curl, isStandalone, isIOS] · js/ui/icons.js [ic] · js/core/data.js [loadCats] · js/ui/cards.js [payLogos] · NS.session (قراءة حيّة)
 * يعرض على window.KTApp: renderTabbar, renderFooter
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $, esc, curl, isStandalone, isIOS } = NS;   // js/core/utils.js
const { ic } = NS;   // js/ui/icons.js
const { loadCats } = NS;   // js/core/data.js
const { payLogos } = NS;   // js/ui/cards.js

/* ===================== #tabbar: تبويبات الموبايل والفوتر ===================== */
// #tabbar #footer #mobile-nav

function renderTabbar(page) {
  document.body.classList.add('has-tabbar');
  const t = (href, icon, label, on, attrs = '') => `<${href ? `a href="${href}"` : 'button type="button"'} class="tabbar__item ${on ? 'is-on' : ''}" ${attrs}>${ic(icon, 'ico-lg')}${icon === 'cart' ? '<b class="badge" data-cart-count hidden>0</b>' : ''}<span>${label}</span></${href ? 'a' : 'button'}>`;
  const el = document.createElement('nav'); el.className = 'tabbar'; el.setAttribute('aria-label', 'التنقل');
  el.innerHTML = t('/', 'home', 'الرئيسية', page === 'home') + t('', 'grid', 'الأقسام', page === 'category', 'data-open-cats') + t('/offers/', 'offers', 'العروض', page === 'offers') + t('/cart.html', 'cart', 'السلة', page === 'cart') + t(NS.session ? '/profile' : '/auth.html', 'user', 'حسابي', ['account', 'profile', 'myorders', 'myreviews', 'auth'].includes(page));
  document.body.appendChild(el);
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.hidden = true;
  sh.innerHTML = `<div class="sheet__scrim" data-close-cats></div><div class="sheet__panel" role="dialog" aria-modal="true" aria-label="الأقسام"><div class="sheet__head"><h2>تسوق حسب القسم</h2><button class="icon-btn" data-close-cats aria-label="إغلاق">${ic('x')}</button></div><div id="sheet-grid" class="sheet__grid"></div></div>`;
  document.body.appendChild(sh);
  const close = () => { sh.hidden = true; document.body.classList.remove('no-scroll'); };
  const open = async () => { sh.hidden = false; document.body.classList.add('no-scroll'); const list = await loadCats(); $('#sheet-grid').innerHTML = [['/offers/', 'offers', 'العروض'], ['/yours-offer', 'yours', 'عروضك'], ...list.map(c => [curl(c.slug), c.slug, c.name])].map(([h, i, n]) => `<a href="${h}" class="sheet__tile"><span class="cat__ic">${ic(i)}</span><span>${esc(n)}</span></a>`).join(''); };
  document.addEventListener('click', e => { if (e.target.closest('[data-open-cats]')) open(); else if (e.target.closest('[data-close-cats]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sh.hidden) close(); });
}

function renderFooter() {
  const l = (h, t) => `<a href="${h}">${t}</a>`;
  $('#site-footer').innerHTML = `<footer class="ftr"><div class="wrap"><div class="ftr__row"><a href="/" class="logo" aria-label="Kitchenly"><img src="/assets/img/logo-mark.jpg" alt="">KITCHENLY</a>
  <nav class="ftr__links" aria-label="روابط">${l('/shop.html', 'المنتجات')}${l('/offers/', 'العروض')}${l('/yours-offer', 'عروضك')}${l('/track.html', 'تتبع طلبك')}${l('/help', 'المساعدة')}${l('/about', 'من نحن')}${l('/be-seller/signup', 'بيع على Kitchenly')}<a href="#" data-install-link ${isStandalone() || !isIOS ? 'hidden' : ''}>ثبّت التطبيق</a>${l('/contact.html', 'تواصل معنا')}</nav></div>
  <nav class="ftr__links ftr__legal" aria-label="السياسات">${l('/policy', 'سياسات المتجر')}${l('/policy#returns', 'الاستبدال والاسترجاع')}${l('/privacy', 'سياسة الخصوصية')}${l('/policy#terms', 'الشروط والأحكام')}${l('/join-us', 'انضم إلينا')}</nav>
  <div class="ftr__pay"><span>وسائل الدفع</span>${payLogos(['instapay'], 'on-dark')}${payLogos(['paymob', 'visa'], 'on-dark')}</div>
  <p class="ftr__copy">جميع الحقوق محفوظة، Kitchenly ${new Date().getFullYear()}</p></div></footer>`;
}

Object.assign(NS, { renderTabbar, renderFooter });
})();
