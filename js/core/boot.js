/* =====================================================================
 * js/core/boot.js
 * الوظيفة: سجل الصفحات (pages) ونقطة الإقلاع: يرسم الهيدر والفوتر وينفّذ صفحة data-page عند DOMContentLoaded.
 * يعتمد على: js/core/utils.js [$] · js/core/supabase.js [getSession] · js/features/cart.js [badge] · js/ui/states.js [errorBox] · js/ui/header.js [renderHeader] · js/ui/footer.js [renderFooter]
 * يعرض على window.KTApp: pages
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $ } = NS;   // js/core/utils.js
const { getSession } = NS;   // js/core/supabase.js
const { badge } = NS;   // js/features/cart.js
const { errorBox } = NS;   // js/ui/states.js
const { renderHeader } = NS;   // js/ui/header.js
const { renderFooter } = NS;   // js/ui/footer.js

/* ===================== #boot: سجل الصفحات والإقلاع ===================== */
// #boot #router #pages #domcontentloaded
const pages = {};

document.addEventListener('DOMContentLoaded', async () => {
  try { await getSession(); } catch { /* بدون اتصال */ }
  renderHeader(); renderFooter(); badge();
  const run = pages[document.body.dataset.page];
  if (run) { try { await run(); } catch (err) { console.error(err); const a = $('#app'); if (a) a.innerHTML = `<div class="wrap page">${errorBox()}</div>`; } }
});

Object.assign(NS, { pages });
})();
