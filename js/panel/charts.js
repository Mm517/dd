/* =====================================================================
 * js/panel/charts.js
 * الوظيفة: تواريخ ورسوم بيانية SVG (بدون مكتبات) وتصدير CSV وتحميل وتجميع المبيعات (kt_sales_lines).
 * يعتمد على: js/panel/core.js [sb, esc, fmt]
 * يعرض على window.Panel: dkey, lastDays, dshort, areaChart, barChart, hbars, sum, csv, loadSales, groupOrders
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.Panel = window.Panel || {});
const { sb, esc, fmt } = NS;   // js/panel/core.js

/* ===================== #charts: تواريخ ورسوم بيانية SVG وتصدير CSV ===================== */
// #charts #svg #csv #dates
const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const lastDays = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (n - 1 - i)); return dkey(d); });
const dshort = k => new Date(k + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
const nice = m => { if (m <= 0) return 1; const p = 10 ** Math.floor(Math.log10(m)), f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
function areaChart(keys, vals, { color = 'var(--brand)', unit = '' } = {}) {
  const W = 640, H = 220, L = 44, R = 10, T = 12, B = 26, max = nice(Math.max(...vals, 1)), n = keys.length;
  const x = i => L + (n === 1 ? 0 : (i * (W - L - R)) / (n - 1)), y = v => T + (H - T - B) * (1 - v / max);
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const grid = [0, .25, .5, .75, 1].map(f => { const v = max * f, yy = y(v); return `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-dasharray="${f ? '3 4' : ''}"/><text x="${L - 6}" y="${yy + 3}" text-anchor="end">${fmt(v)}</text>`; }).join('');
  const step = Math.ceil(n / 7), xl = keys.map((k, i) => (i % step === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${dshort(k)}</text>` : '')).join('');
  const dots = vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${n > 31 ? 0 : 3}" fill="#fff" stroke="${color}" stroke-width="2"><title>${dshort(keys[i])}: ${fmt(v)} ${unit}</title></circle>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم بياني">${grid}<path d="M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)}Z" fill="${color}" opacity=".12"/><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${dots}${xl}</svg>`;
}
function barChart(items, { color = 'var(--brand)', unit = '' } = {}) {
  const W = 640, H = 200, L = 40, T = 10, B = 26, n = items.length || 1, max = nice(Math.max(...items.map(i => i.v), 1)), bw = (W - L - 10) / n;
  const bars = items.map((it, i) => { const h = (H - T - B) * (it.v / max), xx = L + i * bw + bw * .18; return `<rect x="${xx}" y="${H - B - h}" width="${bw * .64}" height="${Math.max(h, 0)}" rx="4" fill="${color}"><title>${esc(it.l)}: ${fmt(it.v)} ${unit}</title></rect><text x="${xx + bw * .32}" y="${H - 8}" text-anchor="middle">${esc(it.l)}</text>`; }).join('');
  const grid = [0, .5, 1].map(f => { const yy = H - B - (H - T - B) * f; return `<line x1="${L}" x2="${W - 6}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${L - 6}" y="${yy + 3}" text-anchor="end">${fmt(max * f)}</text>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم بياني">${grid}${bars}</svg>`;
}
const hbars = (rows, f = fmt) => { const m = Math.max(...rows.map(r => r.v), 1); return `<ul class="rows">${rows.map(r => `<li style="display:block"><div style="display:flex;justify-content:space-between;gap:10px"><span>${esc(r.l)}</span><b class="num">${f(r.v)}</b></div><div class="bar" style="margin-top:6px"><i style="width:${(r.v / m) * 100}%"></i></div></li>`).join('')}</ul>`; };
const sum = (a, f) => a.reduce((s, x) => s + (+f(x) || 0), 0);
function csv(name, rows) {
  const b = new Blob(['\ufeff' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ===================== #sales: تحميل المبيعات وتجميعها (kt_sales_lines) ===================== */
// #sales #analytics #orders
async function loadSales(storeId = null) {
  const { data, error } = await sb.rpc('kt_sales_lines', { p_store: storeId }); if (error) throw error;
  return (data || []).map(r => ({ ...r, total: r.qty * r.price }));
}
function groupOrders(lines) {
  const m = new Map();
  lines.forEach(l => { let o = m.get(l.order_id); if (!o) { o = { id: l.order_id, no: l.order_no, at: l.created_at, status: l.status, pay: l.payment_method, name: l.customer_name, phone: l.phone, city: l.city, address: l.address, lines: [], total: 0, stores: new Set() }; m.set(l.order_id, o); } o.lines.push(l); o.total += l.total; o.stores.add(l.store_name || 'Kitchenly'); });
  return [...m.values()].sort((a, b) => new Date(b.at) - new Date(a.at));
}

Object.assign(NS, { dkey, lastDays, dshort, areaChart, barChart, hbars, sum, csv, loadSales, groupOrders });
})();
