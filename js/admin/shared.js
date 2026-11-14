/* =====================================================================
 * js/admin/shared.js
 * الوظيفة: ثوابت وأدوات مشتركة بين صفحات لوحة الأدمن وسجل الصفحات (pages).
 * يعتمد على: window.Panel [sb, $, esc, ic, modal]
 * يعرض على window.Panel.admin: BASE, field, tbl, stat, pgh, live, KIT, reason, count, pages
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel.admin = window.Panel.admin || {});
const { sb, $, esc, ic, modal } = window.Panel;

/* ===================== #admin-shared: ثوابت وأدوات مشتركة وسجل الصفحات ===================== */
// #admin #shared #pages-registry
const BASE = '/admin';
const field = (id, label, attrs = '', hint = '') => `<div><label class="lbl" for="${id}">${label}</label><input class="field" id="${id}" ${attrs}>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
const tbl = (head, rows, empt) => rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : empt;
const stat = (icon, label, val, d = '', cls = '') => `<div class="card stat ${cls}"><div class="stat__l">${ic(icon)}${label}</div><div class="stat__v">${val}</div>${d ? `<div class="stat__d">${d}</div>` : ''}</div>`;
const pgh = (t, s, act = '') => `<div class="pgh"><div><h2>${t}</h2>${s ? `<p>${s}</p>` : ''}</div><div>${act}</div></div>`;
const live = l => l.filter(x => x.status !== 'cancelled');
const KIT = 'Kitchenly (منتجاتنا)';
const reason = (title, ok = 'رفض', ph = 'اكتب السبب ليظهر للبائع') => new Promise(res => {
  const d = modal(`<form class="dlg" novalidate><h2>${esc(title)}</h2><div><label class="lbl" for="rr">السبب</label><textarea class="field" id="rr" rows="3" maxlength="300" placeholder="${ph}"></textarea></div><div class="dlg__foot"><button type="button" class="btn btn-g" id="rn">إلغاء</button><button class="btn btn-d">${ok}</button></div></form>`);
  let done = false; $('#rn', d).onclick = () => d.close();
  $('form', d).onsubmit = e => { e.preventDefault(); const v = $('#rr', d).value.trim(); if (v.length < 3) { $('#rr', d).focus(); return; } done = true; d.close(); res(v); };
  d.addEventListener('close', () => { if (!done) res(null); });
});
const count = async (table, f) => { let q = sb.from(table).select('id', { count: 'exact', head: true }); q = f(q); const { count: n } = await q; return n || 0; };
const pages = {};

Object.assign(NS, { BASE, field, tbl, stat, pgh, live, KIT, reason, count, pages });
})();
