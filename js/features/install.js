/* =====================================================================
 * js/features/install.js
 * الوظيفة: تثبيت الموقع كتطبيق (PWA): بانر التثبيت، iOS، وتسجيل الـ Service Worker.
 * يعتمد على: js/core/utils.js [isStandalone, isIOS] · js/ui/icons.js [ic] · js/ui/toast.js [toast]
 * يعرض على window.KTApp: لا شيء
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { isStandalone, isIOS } = NS;   // js/core/utils.js
const { ic } = NS;   // js/ui/icons.js
const { toast } = NS;   // js/ui/toast.js

/* ===================== #install: بانر تثبيت التطبيق وتسجيل الـ Service Worker ===================== */
// #install #pwa #service-worker #ios

let deferredInstall = null;
const SNOOZE = 'kt_install_snooze';
const snoozed = () => { try { return Date.now() < +(localStorage.getItem(SNOOZE) || 0); } catch { return false; } };
const snooze = days => { try { localStorage.setItem(SNOOZE, String(Date.now() + days * 864e5)); } catch { /* */ } };
function showInstall(force = false) {
  if (isStandalone() || document.getElementById('install')) return;
  if (!force && snoozed()) return;
  if (!deferredInstall && !isIOS) return;
  const el = document.createElement('div'); el.id = 'install'; el.className = 'install'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'تثبيت التطبيق');
  el.innerHTML = `<img src="/assets/icons/icon-192.png" alt="" width="48" height="48"><div class="install__t"><b>ثبّت تطبيق Kitchenly</b><span>${deferredInstall ? 'افتح المتجر من شاشة موبايلك بضغطة، وأسرع وبدون متصفح.' : 'اضغط <i class="install__sh" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg></i> مشاركة ثم «إضافة إلى الشاشة الرئيسية».'}</span></div>${deferredInstall ? '<button type="button" class="install__go" data-install-go>تثبيت</button>' : ''}<button type="button" class="install__x" data-install-x aria-label="إغلاق">${ic('x')}</button>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
}
const hideInstall = () => { const el = document.getElementById('install'); if (el) { el.classList.remove('on'); setTimeout(() => el.remove(), 300); } };
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; document.querySelectorAll('[data-install-link]').forEach(a => { a.hidden = false; }); setTimeout(() => showInstall(), 4000); });
window.addEventListener('appinstalled', () => { deferredInstall = null; hideInstall(); document.querySelectorAll('[data-install-link]').forEach(a => { a.hidden = true; }); toast('تم تثبيت التطبيق'); });
document.addEventListener('click', async e => {
  if (e.target.closest('[data-install-x]')) { snooze(7); hideInstall(); return; }
  if (e.target.closest('[data-install-go]') || e.target.closest('[data-install-link]')) {
    e.preventDefault();
    if (deferredInstall) { const d = deferredInstall; deferredInstall = null; hideInstall(); d.prompt(); try { await d.userChoice; } catch { /* */ } }
    else if (isIOS) showInstall(true);
  }
});
if (isIOS && !isStandalone()) setTimeout(() => showInstall(), 6000);
if (isStandalone()) document.documentElement.classList.add('is-app');
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { /* اختياري */ }));
})();
