/* =====================================================================
 * js/ui/icons.js
 * الوظيفة: أيقونات SVG للواجهة، وصور الأيقونات (3D) للأقسام، ونجوم التقييم.
 * يعتمد على: لا شيء
 * يعرض على window.KTApp: ic, stars
 * ===================================================================== */
(() => {
'use strict';
const NS = (window.KTApp = window.KTApp || {});

/* ===================== #icons: أيقونات SVG وصور الأقسام والنجوم ===================== */
// #icons #svg #category-icons #stars

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  ret: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  star: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.7"/><path d="M12 17h.01"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  logout: '<path d="M10 4H5v16h5"/><path d="M15 8l4 4-4 4M19 12H9"/>',
  gift: '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M12 9v11M3 13h18"/><path d="M12 9C10 5 6 5 7 8c.5 1.5 3 1 5 1zm0 0c2-4 6-4 5-1-.5 1.5-3 1-5 1z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  /* أيقونات الأقسام */
  'cleaning-tools': '<path d="M14 3l4 4"/><path d="M16 5 8.5 12.5"/><path d="M5 15c1.5-1 3-1 4.5 0l-2 6H4z"/><path d="M9.5 15l1.5 6M13 12.5l.5 8.5M17 14l-1.5 7"/>',
  sponges: '<rect x="3" y="9" width="18" height="8" rx="2"/><path d="M3 13h18"/><circle cx="8" cy="15" r=".7" fill="currentColor"/><circle cx="12" cy="15" r=".7" fill="currentColor"/><circle cx="16" cy="15" r=".7" fill="currentColor"/><path d="M6 6.5c1-1.5 2-1.5 3 0M12 5c1-1.5 2-1.5 3 0"/>',
  organizers: '<rect x="3" y="10" width="18" height="10" rx="1.5"/><path d="M9 10v10M15 10v10"/><path d="M8 10V5h3v5M14 10V7h2v3"/>',
  brushes: '<path d="M18 3l3 3-8 8-3-3z"/><path d="M10 11l-4 1c-2 1-2 4-4 6 3 1 7 1 9-3l1-3z" transform="translate(1 0)"/>',
  microfiber: '<path d="M4 7l8-3 8 3-8 3z"/><path d="M4 11l8 3 8-3"/><path d="M4 15l8 3 8-3"/>',
  bundles: '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M12 9v11M3 13h18"/><path d="M12 9C10 5 6 5 7 8c.5 1.5 3 1 5 1zm0 0c2-4 6-4 5-1-.5 1.5-3 1-5 1z"/>',
  offers: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/><path d="m10.5 16.5 5-5M11 12h.01M15.5 16h.01"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  default: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
};
/* أيقونات صور (3D) بدل الـ SVG للأقسام والعروض وحالات الطلب */
const IMGDIR = '/assets/img/icons/';
const ICONIMG = { offers: 'offers', yours: 'yours', sponges: 'sponges', brushes: 'brushes', microfiber: 'microfiber', 'cleaning-tools': 'cleaning-tools', bundles: 'bundles', organizers: 'organizers', 'st-new': 'order-received', 'st-ship': 'on-the-way', 'st-done': 'courier-arrived', join: 'join-us',
  'st-ok': '/assets/img/states/order-confirmed.webp', 'st-cancel': '/assets/img/states/order-cancelled.webp' };
ICONIMG.organizers = '/assets/img/states/bathroom-organizers.webp';
ICONIMG.bathroom = '/assets/img/icons/bathroom.webp';   /* قسم منظمات الحمام والتخزين */
const ic = (n, c = 'ico') => ICONIMG[n] ? `<img class="${c} ico-img" src="${ICONIMG[n].startsWith('/') ? ICONIMG[n] : `${IMGDIR}${ICONIMG[n]}.png`}" alt="" loading="lazy" decoding="async">` : `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.default}</svg>`;
const stars = r => { const n = Math.round(r); return `<span class="stars" aria-label="تقييم ${r} من 5">${Array.from({ length: 5 }, (_, i) => `<svg class="${i < n ? 'on' : ''}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`).join('')}</span>`; };

Object.assign(NS, { ic, stars });
})();
