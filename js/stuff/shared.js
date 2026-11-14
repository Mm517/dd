/* =====================================================================
 * js/stuff/shared.js
 * الوظيفة: ثوابت وأدوات مشتركة بين صفحات لوحة الفريق (Kitchenly Stuff) وسجل الصفحات (pages).
 * يعتمد على: window.Panel [$, ic]
 * يعرض على window.Panel.stuff: K, BASE, pgh, stat, tbl, field, ico, live, isSeller, keepFocus, pages
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.stuff = window.Panel.stuff || {});
const { $, ic } = window.Panel;

/* ===================== #stuff-shared: ثوابت وأدوات مشتركة ===================== */
// #stuff #shared #helpers #icons
const K = window.KT, BASE = '/stuff';
const pgh = (t, s, act = '') => `<div class="pgh"><div><h2>${t}</h2>${s ? `<p>${s}</p>` : ''}</div><div>${act}</div></div>`;
const stat = (icon, label, val, d = '', cls = '') => `<div class="card stat ${cls}"><div class="stat__l">${ic(icon)}${label}</div><div class="stat__v">${val}</div>${d ? `<div class="stat__d">${d}</div>` : ''}</div>`;
const tbl = (head, rows, empt) => rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empt;
const field = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
const SI = { wallet: 'stuff-money', users: 'stuff-team', help: 'stuff-help' };
const ico = (n, c = '') => (SI[n] ? `<img class="sicon" src="/assets/img/icons/${SI[n]}.png" alt="" width="56" height="56" loading="lazy">` : ic(n, c));
const live = l => l.filter(x => x.status !== 'cancelled');
const SELLER_RX = /\[(دعم بائع|طلب انضمام)\]/;
const isSeller = m => SELLER_RX.test(m.body || '') || /\(بائع\)/.test(m.name || '');
const keepFocus = (el, sel, fn) => e => { const p = e.target.selectionStart; fn(e.target.value.trim().toLowerCase()); const n = $(sel, el); if (n) { n.focus(); n.setSelectionRange(p, p); } };

/* ===================== #stuff-pages: سجل صفحات اللوحة ===================== */
// #stuff #pages-registry
const pages = {};

Object.assign(NS, { K, BASE, pgh, stat, tbl, field, ico, live, isSeller, keepFocus, pages });
})();
