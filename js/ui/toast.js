/* =====================================================================
 * js/ui/toast.js
 * الوظيفة: إشعارات toast المؤقتة (نجاح / خطأ).
 * يعتمد على: js/core/utils.js [$]
 * يعرض على window.KTApp: toast
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});
const { $ } = NS;   // js/core/utils.js

/* ===================== #toast: إشعارات مؤقتة ===================== */
// #toast #notification #feedback

function toast(msg, type = '') {
  let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; w.setAttribute('role', 'status'); document.body.appendChild(w); }
  const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; w.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

Object.assign(NS, { toast });
})();
