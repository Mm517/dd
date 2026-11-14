# هيكل المشروع وترتيب التحميل

المشروع HTML + CSS + JavaScript صافي (بدون build)، السكريبتات بتتحمّل بـ `<script src>` عادية وبترتيب ثابت وبتشارك الدوال عن طريق **مساحات أسماء** على `window` (مفيش ES modules).

## مساحات الأسماء

| المساحة | بتعرّفها | الاستخدام |
|---|---|---|
| `window.KT` | `js/core/config.js` | الإعدادات (Supabase، الشحن، البانرات، الدفع) |
| `window.KTApp` | كل ملفات `js/core/` و`js/ui/` و`js/features/` | واجهة المتجر: الدوال المشتركة + سجل الصفحات `KTApp.pages`. ملفات `js/pages/` بتسجّل صفحاتها فيه |
| `window.Panel` | `js/panel/*` | نواة اللوحات المشتركة (`Panel.start` وأدوات الواجهة) |
| `window.Panel.admin` / `.seller` / `.stuff` | `js/admin/*` و`js/seller/*` و`js/stuff/*` | أدوات وصفحات كل لوحة (داخلية) |

كل ملف JS ملفوف في IIFE بـ `'use strict'`، وبيبدأ بـ `const NS = (window.X = window.X || {})` ثم `const { ... } = NS` للأسماء اللي بيعتمد عليها، وفي آخره `Object.assign(NS, { ... })` للأسماء اللي بيعرضها. الترويسة في أول كل ملف بتوضح "يعتمد على" و"يعرض".

> **قاعدة مهمة:** استدعاءات "للأمام" (دالة في ملف بيتحمّل بعده) متاحة بس وقت الاستخدام مش وقت التحميل. الملفات دي فيها سطر `const اسم = (...args) => NS.اسم(...args)` وتعليق يوضح ده.

> المتغير `session` في `KTApp` هو getter حي (قراءة `SESSION` الأصلي) وليس نسخة.

## ترتيب التحميل

### صفحات المتجر (كل ملفات HTML ما عدا offline و لوحات الإدارة)

1. `js/core/config.js`
2. `js/core/utils.js`
3. `js/core/supabase.js`
4. `js/ui/icons.js`
5. `js/ui/toast.js`
6. `js/features/cart.js`
7. `js/core/data.js`
8. `js/features/search.js`
9. `js/features/discover.js`
10. `js/ui/cards.js`
11. `js/ui/states.js`
12. `js/ui/search-box.js`
13. `js/ui/header.js`
14. `js/ui/footer.js`
15. `js/ui/card-motion.js`
16. `js/ui/cart-fx.js`
17. `js/features/install.js`
18. `js/core/boot.js`
19. `js/ui/list-parts.js`
20. `js/pages/home.js`
21. `js/pages/catalog.js`
22. `js/pages/product.js`
23. `js/pages/cart.js`
24. `js/pages/checkout.js`
25. `js/pages/track.js`
26. `js/pages/contact-404.js`
27. `js/features/ads.js`
28. `js/pages/partner-store.js`
29. `js/pages/auth.js`
30. `js/features/reviews.js`
31. `js/pages/profile.js`
32. `js/pages/yours.js`
33. `js/pages/help.js`
34. `js/pages/legal.js`
35. `js/pages/join-about.js`

### CSS للمتجر (نفس الترتيب في كل صفحة؛ **الترتيب جزء من الأولوية (cascade)** ولا تغيّره)

1. `css/base.css`
2. `css/components/ui-kit.css`
3. `css/layout/header.css`
4. `css/components/tabbar.css`
5. `css/pages/home.css`
6. `css/components/product-card.css`
7. `css/pages/inner-pages.css`
8. `css/components/tables-dialogs.css`
9. `css/layout/footer.css`
10. `css/components/newsletter.css`
11. `css/components/reviews.css`
12. `css/pages/profile.css`
13. `css/pages/help-legal-join.css`
14. `css/components/media.css`
15. `css/layout/catnav-more.css`
16. `css/components/quick-cards.css`
17. `css/pages/payment-legal-track-auth.css`
18. `css/components/banner-skeleton.css`
19. `css/components/product-card-v2.css`
20. `css/pages/states-about.css`
21. `css/components/media-box-focus.css`
22. `css/components/tabbar-glass.css`
23. `css/components/install-banner.css`
24. `css/pages/partner-store.css`
25. `css/components/product-card-motion.css`

### اللوحات

`/admin` و`/be-seller` و`/stuff` بتحمّل `css/panel.css` ثم:

**admin:** `js/core/config.js` ← `js/panel/core.js` ← `js/panel/ui.js` ← `js/panel/charts.js` ← `js/panel/uploads.js` ← `js/panel/product-form.js` ← `js/panel/list-tools.js` ← `js/panel/staff-auth.js` ← `js/panel/router.js` ← `js/admin/shared.js` ← `js/admin/auth.js` ← `js/admin/overview.js` ← `js/admin/orders.js` ← `js/admin/products.js` ← `js/admin/product-requests.js` ← `js/admin/stores.js` ← `js/admin/ads.js` ← `js/admin/money.js` ← `js/admin/analytics.js` ← `js/admin/categories.js` ← `js/admin/messages.js` ← `js/admin/customers.js` ← `js/admin/index.js`

**be-seller:** `js/core/config.js` ← `js/panel/core.js` ← `js/panel/ui.js` ← `js/panel/charts.js` ← `js/panel/uploads.js` ← `js/panel/product-form.js` ← `js/panel/list-tools.js` ← `js/panel/staff-auth.js` ← `js/panel/router.js` ← `js/seller/shared.js` ← `js/seller/auth.js` ← `js/seller/overview.js` ← `js/seller/orders.js` ← `js/seller/products.js` ← `js/seller/analytics.js` ← `js/seller/store.js` ← `js/seller/marketing.js` ← `js/seller/payouts.js` ← `js/seller/settings.js` ← `js/seller/index.js`

**stuff:** `js/core/config.js` ← `js/panel/core.js` ← `js/panel/ui.js` ← `js/panel/charts.js` ← `js/panel/uploads.js` ← `js/panel/product-form.js` ← `js/panel/list-tools.js` ← `js/panel/staff-auth.js` ← `js/panel/router.js` ← `js/stuff/shared.js` ← `js/stuff/auth.js` ← `js/stuff/help.js` ← `js/stuff/store.js` ← `js/stuff/team.js` ← `js/stuff/index.js`

## جدول قبل / بعد

| الملف القديم | سطور قبل | الملف الجديد | سطور بعد | المسؤولية |
|---|---|---|---|---|
| `js/app.js` | 546 | `js/core/utils.js` | 29 | دوال مساعدة عامة (اختصار DOM، تنسيق الأرقام والفلوس، روابط المنتج/القسم، باراميترات الرابط) وكشف وضع التطبيق/iOS. |
|  |  | `js/core/supabase.js` | 25 | إنشاء عميل Supabase للمتجر وجلسة العميل (getSession / requireLogin). |
|  |  | `js/ui/icons.js` | 65 | أيقونات SVG للواجهة، وصور الأيقونات (3D) للأقسام، ونجوم التقييم. |
|  |  | `js/ui/toast.js` | 22 | إشعارات toast المؤقتة (نجاح / خطأ). |
|  |  | `js/features/cart.js` | 40 | السلة المحفوظة في localStorage (إضافة/حذف/تعديل/إجمالي) وشارة العدد وحساب الشحن. |
|  |  | `js/core/data.js` | 54 | طبقة بيانات المتجر: استعلامات Supabase للأقسام والمنتجات والطلبات والتقييمات + كاش الأقسام والمنتجات. |
|  |  | `js/features/search.js` | 68 | البحث: تطبيع عربي مرن + مرادفات + تقييم النتائج + البحث الذكي (AI) + تصغير صورة البحث بالصورة. |
|  |  | `js/features/discover.js` | 56 | فهم اهتمام العميل (بحثه، اللي شاهده، سلته، طلباته) محليًا على جهازه لاقتراح "مختارة لك". |
|  |  | `js/ui/cards.js` | 49 | رسم كارت المنتج والسكلتون وصور المنتج ولوجوهات الدفع، وسكلتون الصور أثناء التحميل. |
|  |  | `js/ui/states.js` | 26 | صناديق الحالات (خطأ، لا توجد منتجات، فارغ) وتسميات حالات الطلب وطرق الدفع. |
|  |  | `js/ui/search-box.js` | 58 | صندوق البحث في الهيدر: اقتراحات فورية، بحث نصي، وبحث بالصورة. |
|  |  | `js/ui/header.js` | 78 | هاشتاج الصفحة، رسم الهيدر وشريط الأقسام (مع زر "المزيد"). |
|  |  | `js/ui/footer.js` | 43 | شريط التبويبات السفلي للموبايل والفوتر. |
|  |  | `js/ui/card-motion.js` | 97 | أشكال الكروت المتعددة (variants) + الظهور التدريجي مع السكرول + تبديل صور الكارت عند المرور. |
|  |  | `js/ui/cart-fx.js` | 71 | زر "أضف للسلة": ربط الضغط، نبضة الزر، الصورة الطايرة للسلة، و bounce للأيقونة. |
|  |  | `js/features/install.js` | 43 | تثبيت الموقع كتطبيق (PWA): بانر التثبيت، iOS، وتسجيل الـ Service Worker. |
|  |  | `js/core/boot.js` | 29 | سجل الصفحات (pages) ونقطة الإقلاع: يرسم الهيدر والفوتر وينفّذ صفحة data-page عند DOMContentLoaded. |
| `js/store.js` | 432 | `js/ui/list-parts.js` | 37 | مكوّنات مشتركة لصفحات القوائم: عنوان القسم، شريط الترتيب وعرض شبكة/قائمة، غلاف صفحة القائمة، شريحة الأقسام. |
|  |  | `js/pages/home.js` | 119 | الصفحة الرئيسية: الاشتراك في العروض، بانر الرئيسية المتبدّل، وصفحة home (كروت الأقسام والعروض ومختارة لك). |
|  |  | `js/pages/catalog.js` | 99 | صفحات القوائم: الأقسام /category والعروض /offers والمنتجات + نتائج البحث (نصي وبالصورة) /shop. |
|  |  | `js/pages/product.js` | 57 | صفحة المنتج: المعرض والسعر والإضافة للسلة والمنتجات المشابهة والتقييمات. |
|  |  | `js/pages/cart.js` | 42 | صفحة السلة: تعديل الكميات والحذف وملخص الطلب. |
|  |  | `js/pages/checkout.js` | 65 | إتمام الطلب والدفع (المحافظات، الشحن، طرق الدفع) وصفحة تأكيد الطلب. |
|  |  | `js/pages/track.js` | 63 | تتبع الطلب: خطوات الحالة وكارت الطلب والبحث برقم الموبايل. |
|  |  | `js/pages/contact-404.js` | 29 | صفحة تواصل معنا وصفحة 404 وتحويل صفحة السياسات القديمة للصفحات الجديدة. |
|  |  | `js/features/ads.js` | 33 | الإعلانات المموّلة (kt_active_ads): تسجيل الظهور والنقر وعرض الكروت المموّلة. |
|  |  | `js/pages/partner-store.js` | 34 | صفحة المتجر الشريك /store/<slug>. |
| `js/account.js` | 87 | `js/pages/auth.js` | 99 | تسجيل الدخول (كلمة مرور أو كود على الإيميل) وإنشاء الحساب بتأكيد الكود، وتحويل صفحة الحساب القديمة للبروفايل. |
| `js/extra.js` | 315 | `js/features/reviews.js` | 95 | تقييمات المنتجات (لمن استلم المنتج فعلًا): نموذج التقييم وعرضه داخل صفحة المنتج + أدوات صغيرة مشتركة (تاريخ، JSON، نجمة). |
|  |  | `js/pages/profile.js` | 116 | البروفايل /profile و /profile/my-orders و /profile/my-reviews. |
|  |  | `js/pages/yours.js` | 45 | صفحة "عروضك" /yours-offer: عروض مرتبة حسب اهتمام العميل. |
|  |  | `js/pages/help.js` | 40 | مركز المساعدة /help. |
|  |  | `js/pages/legal.js` | 44 | السياسات /policy والخصوصية /privacy (قالب صفحة قانونية مشترك). |
|  |  | `js/pages/join-about.js` | 49 | انضم إلينا /join-us ومن نحن /about. |
| `js/panel.js` | 340 | `js/panel/core.js` | 58 | أساس اللوحات: عميل Supabase المستقل (جلسة منفصلة عن المتجر)، اختصارات DOM، تنسيقات الأرقام والتواريخ، وأيقونات اللوحة. |
|  |  | `js/panel/ui.js` | 46 | مكوّنات واجهة اللوحات: toast، نافذة، تأكيد، سكلتون، حالة فاضية، شارات، وخرائط حالات الطلب/المتجر/المنتج/الإعلان. |
|  |  | `js/panel/charts.js` | 53 | تواريخ ورسوم بيانية SVG (بدون مكتبات) وتصدير CSV وتحميل وتجميع المبيعات (kt_sales_lines). |
|  |  | `js/panel/uploads.js` | 40 | رفع الصور إلى Supabase Storage (bucket store-assets) مع تصغير وحقل صورة بمعاينة. |
|  |  | `js/panel/product-form.js` | 63 | نموذج المنتج المشترك بين البائع والأدمن (إضافة/تعديل منتج). |
|  |  | `js/panel/list-tools.js` | 48 | أدوات القوائم: تحميل تدريجي (pager)، debounce، وتنظيف نص البحث لفلاتر PostgREST. |
|  |  | `js/panel/staff-auth.js` | 78 | شاشة دخول/إنشاء حساب للوحات الفريق والأدمن (مسموح فقط للإيميلات داخل kt_admins). |
|  |  | `js/panel/router.js` | 72 | الراوتر والهيكل (History API): تنقل بدون ريفريش، رسم الشل، تشغيل الصفحات، و Panel.start. |
| `js/admin-panel.js` | 402 | `js/admin/shared.js` | 31 | ثوابت وأدوات مشتركة بين صفحات لوحة الأدمن وسجل الصفحات (pages). |
|  |  | `js/admin/auth.js` | 42 | حماية لوحة الأدمن: التحقق من الصلاحية (kt_is_admin) وشاشة الدخول وعدّادات الشارات. |
|  |  | `js/admin/overview.js` | 29 | نظرة عامة على لوحة الإدارة (إحصاءات المتاجر والملخصات). |
|  |  | `js/admin/orders.js` | 89 | الطلبات: قوائم الحالات (جديدة/مؤكدة/في الطريق...) وصفحة تفاصيل الطلب. |
|  |  | `js/admin/products.js` | 47 | المنتجات: قائمة بتحميل تدريجي (20 منتج كل مرة) وتعديل المنتج. |
|  |  | `js/admin/product-requests.js` | 46 | طلبات المنتجات من البائعين: بانتظار المراجعة / معتمدة / مرفوضة. |
|  |  | `js/admin/stores.js` | 83 | المتاجر وطلبات البائعين: كروت المتاجر بإحصائياتها وإدارة المتجر (manage). |
|  |  | `js/admin/ads.js` | 32 | إدارة الإعلانات المموّلة (جدول kt_ads). |
|  |  | `js/admin/money.js` | 41 | الأموال: دفعات البائعين (kt_payouts) وإيرادات الإعلانات والمتاجر. |
|  |  | `js/admin/analytics.js` | 40 | التحليلات: أرقام الإعلانات ومشاهدات المنتجات والمتاجر (kt_ads / kt_product_views / kt_stores). |
|  |  | `js/admin/categories.js` | 27 | إدارة الأقسام. |
|  |  | `js/admin/messages.js` | 27 | رسائل التواصل من العملاء. |
|  |  | `js/admin/customers.js` | 32 | العملاء (بيانات مجمّعة من جدول الطلبات kt_orders). |
|  |  | `js/admin/index.js` | 32 | تسجيل لوحة الأدمن في الراوتر (Panel.start): المسارات والقوائم والحماية. |
| `js/seller.js` | 327 | `js/seller/shared.js` | 32 | ثوابت وأدوات مشتركة بين صفحات لوحة البائع (محافظات، أنواع النشاط، حقول، جداول) وسجل الصفحات (pages). |
|  |  | `js/seller/auth.js` | 130 | دخول البائع وإنشاء حسابه (بدون شل) + الحماية وبانر حالة المتجر. |
|  |  | `js/seller/overview.js` | 32 | نظرة عامة للبائع. |
|  |  | `js/seller/orders.js` | 31 | طلبات البائع (من خطوط المبيعات). |
|  |  | `js/seller/products.js` | 33 | منتجات البائع (إضافة/تعديل). |
|  |  | `js/seller/analytics.js` | 39 | تحليلات البائع (مبيعات ومشاهدات المنتجات). |
|  |  | `js/seller/store.js` | 34 | بيانات متجر البائع (جدول kt_stores). |
|  |  | `js/seller/marketing.js` | 53 | التسويق: الحملات والإعلانات المموّلة. |
|  |  | `js/seller/payouts.js` | 30 | مدفوعات البائع وطلب السحب (kt_request_payout). |
|  |  | `js/seller/settings.js` | 38 | إعدادات البائع وصفحة المساعدة (رسائل kt_messages). |
|  |  | `js/seller/index.js` | 35 | تسجيل لوحة البائع في الراوتر (Panel.start). |
| `js/stuff.js` | 178 | `js/stuff/shared.js` | 31 | ثوابت وأدوات مشتركة بين صفحات لوحة الفريق (Kitchenly Stuff) وسجل الصفحات (pages). |
|  |  | `js/stuff/auth.js` | 37 | دخول الفريق وحماية اللوحة وعدّادات الشارات. |
|  |  | `js/stuff/help.js` | 45 | طلبات المساعدة: مستخدمين / بائعين / الكل. |
|  |  | `js/stuff/store.js` | 89 | متجر Kitchenly نفسه: البيانات والمنتجات والصور والأموال. |
|  |  | `js/stuff/team.js` | 34 | صفحة "فريقي": عرض وإضافة وحذف أعضاء الفريق (kt_team_*). |
|  |  | `js/stuff/index.js` | 32 | تسجيل لوحة الفريق في الراوتر (Panel.start). |
| `js/config.js` | 22 | `js/core/config.js` | 28 | إعدادات المتجر |
| `css/main.css` | 871 | (25 ملف، انظر أعلاه) | 1058 | تقسيم تتابعي بنفس ترتيب الأولوية |
| `css/panel.css` | 205 | `css/panel.css` | 219 | بدون تقسيم (أقل من 300 سطر) + وسوم |
| `sw.js` | 43 | `sw.js` | 107 | قائمة الكاش الجديدة + نسخة kt-v5 |

مجموع سطور JS: قبل 2649 ← بعد 3758 (الزيادة = ترويسات وعناوين أقسام ووسوم وأسطر الاستيراد/التصدير).

## إضافة ميزة أو صفحة جديدة

- **صفحة متجر جديدة:** أنشئ `js/pages/xxx.js` بنفس نمط الملفات الموجودة (`const NS = ...` ثم `NS.pages.xxx = ...`)، وأضفه لقائمة `<script>` في الصفحات وفي `SHELL` داخل `sw.js`، وارفع رقم `V` فيه.
- **صفحة لوحة جديدة:** أضف `js/admin/xxx.js` (أو seller/stuff) قبل `index.js` واربطها في `routes` داخل `index.js`.
- **CSS جديد:** أضفه في نهاية الشريحة المناسبة أو في ملف جديد **آخر القائمة** (القواعد المتأخرة بتغلب المبكّرة).

## الخدمات الخارجية والنشر

`vercel.json` و`_redirects` و`manifest.webmanifest` و`supabase/*.sql` لم تتغير. `sw.js` بيتجاهل (من الشبكة دايمًا) مسارات `/admin` `/be-seller` `/stuff` و`/css/panel.css` و`/js/(panel|admin|seller|stuff)/`.

