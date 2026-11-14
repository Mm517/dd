/* =====================================================================
 * js/core/utils.js
 * الوظيفة: دوال مساعدة عامة (اختصار DOM، تنسيق الأرقام والفلوس، روابط المنتج/القسم، باراميترات الرابط) وكشف وضع التطبيق/iOS.
 * يعتمد على: لا شيء
 * يعرض على window.KTApp: K, $, $$, esc, fmt, money, purl, curl, params, isStandalone, isIOS
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});

/* ===================== #utils: دوال مساعدة عامة ===================== */
// #utils #dom #format #escape-html
const K = window.KT;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const money = n => `${fmt(n)} جنيه`;
const purl = p => `/product/${p.slug}`;
const curl = slug => `/category/${slug}`;
const params = new URLSearchParams(location.search);

/* ===================== #platform: كشف وضع التطبيق المثبّت و iOS ===================== */
// #platform #pwa #ios
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

Object.assign(NS, { K, $, $$, esc, fmt, money, purl, curl, params, isStandalone, isIOS });
})();
