# فهرس وسوم البحث (TAGS)

وسوم البحث تعليقات إنجليزية بصيغة kebab-case موضوعة في JS و CSS و HTML. نفس اسم الوسم بيتكرر في كل الملفات اللي تخص نفس الميزة، فتقدر تبحث بالوسم وتلاقي الميزة كلها.

## طريقة البحث

```bash
grep -rn "#cart" js css *.html        # كل ما يخص السلة (JS + CSS + HTML)
grep -rln "#product-card" js css       # الملفات اللي فيها كارت المنتج
grep -rn "#page-checkout" js            # مسار صفحة الدفع
```

> **تنبيه:** ده غير "هاشتاج الصفحة" الموجود أصلًا في الموقع (`TAGS` في `js/ui/header.js` بنصوص عربية زي `#سلة_التسوق`)، فهو نص ظاهر للمستخدم ولم يتغير.

## قواعد

- وسوم الصفحات التلقائية بصيغة `#page-<اسم>` وتقابل `pages.<اسم>` في JS.
- كل قسم له سطر عنوان `/* ===== #وسم: الوصف ===== */` يليه سطر الوسوم.
- وسوم HTML داخل `<!-- ... -->`، و CSS داخل `/* ... */`، و JS بعد `//`.

## الوسوم

| الوسم | السياق (الأقسام اللي ظاهر فيها) | الملفات |
|---|---|---|
| `#about` | من نحن؛ انضم إلينا | `about/index.html`, `css/pages/states-about.css`, `js/pages/join-about.js` |
| `#accessibility` | بدون المربع الأزرق/الأخضر عند اللمس على الموبايل | `css/components/media-box-focus.css`, `css/components/product-card-motion.css` |
| `#account` | تحويل صفحة الحساب القديمة؛ حسابي وطلباتي وتقييماتي | `account.html`, `js/pages/auth.js`, `js/pages/profile.js`, `profile/index.html` |
| `#add-item` | إضافة وحذف المنتجات وحساب الشحن | `js/features/cart.js` |
| `#add-to-cart` | كارت المنتج بسيط وفيه كل المعلومات؛ صفحة المنتج (الصورة والمعلومات والكمية والضمانات | `css/components/product-card-motion.css`, `css/components/product-card-v2.css`, `css/pages/inner-pages.css`, `js/pages/product.js` (+1) |
| `#admin` | الإعلانات؛ التحليلات | `admin/index.html`, `css/panel.css`, `js/admin/ads.js`, `js/admin/analytics.js` (+13) |
| `#ads` | المتاجر الشريكة والإعلانات؛ الإعلانات | `css/pages/partner-store.css`, `js/admin/ads.js`, `js/features/ads.js`, `js/seller/marketing.js` |
| `#ai-box` | صندوق البحث الذكي | `css/pages/inner-pages.css` |
| `#ai-search` | صندوق البحث الذكي؛ بحث عربي مرن واقتراحات ذكية | `css/pages/inner-pages.css`, `js/features/search.js`, `js/pages/catalog.js` |
| `#alerts` | أزرار وحقول وتنبيهات وchips وسكلتون وtoast | `css/components/ui-kit.css` |
| `#analytics` | التحليلات؛ تحميل المبيعات وتجميعها (kt_sales_lines) | `js/admin/analytics.js`, `js/panel/charts.js`, `js/seller/analytics.js` |
| `#animation` | نبضة الزر والصورة الطايرة وbounce السلة | `css/components/product-card-motion.css`, `js/ui/cart-fx.js` |
| `#arabic-normalize` | بحث عربي مرن واقتراحات ذكية | `js/features/search.js` |
| `#aspect-ratio` | صندوق صورة مربع ثابت في كل الكروت (الصورة جوّاه  | `css/components/media-box-focus.css` |
| `#auth` | كارت مركزي (الدخول/الكود/التبويبات)؛ تسجيل الدخول بخلفية صورة مموّهة (blur) | `auth.html`, `css/pages/inner-pages.css`, `css/pages/payment-legal-track-auth.css`, `js/admin/auth.js` (+4) |
| `#auth-session` | عميل Supabase المستقل وأدوات التنسيق | `js/panel/core.js` |
| `#backdrop-blur` | تسجيل الدخول بخلفية صورة مموّهة (blur) | `css/pages/payment-legal-track-auth.css` |
| `#badge` | حالات الطلب والمتجر والمنتج والإعلان | `js/panel/ui.js` |
| `#badges` | الحماية والدخول (حساب مستقل)؛ الدخول والحماية | `css/components/product-card-motion.css`, `css/panel.css`, `js/admin/auth.js`, `js/stuff/auth.js` |
| `#balance` | الأموال؛ المدفوعات | `js/admin/money.js`, `js/seller/payouts.js` |
| `#banner` | شريط علوي أصغر + بانر سلايدر أصغر + كارت منتج بس؛ بانر الرئيسية (أصغر ومتوسّط، وبيتبدّل fade) | `css/components/banner-skeleton.css`, `css/components/install-banner.css`, `js/pages/home.js` |
| `#banners` | — | `js/core/config.js` |
| `#base` | المتغيرات والـ reset والعناصر العامة | `css/base.css` |
| `#boot` | سجل الصفحات والإقلاع | `js/core/boot.js` |
| `#bootstrap` | تسجيل اللوحة في الراوتر | `js/admin/index.js`, `js/seller/index.js`, `js/stuff/index.js` |
| `#brand` | — | `css/panel.css` |
| `#breadcrumbs` | الصفحات الداخلية (عناوين وشريط أدوات وفتات الخبز؛ غلاف صفحات القوائم (الأقسام والعروض) وشريحة الأق | `css/pages/inner-pages.css`, `js/ui/list-parts.js` |
| `#broken-image` | — | `css/components/product-card-motion.css` |
| `#bump` | — | `css/components/product-card-motion.css` |
| `#buttons` | أزرار وحقول وتنبيهات وchips وسكلتون وtoast | `css/components/ui-kit.css` |
| `#cache` | استعلامات Supabase وكاش المنتجات والأقسام | `js/core/data.js` |
| `#campaigns` | الحملات؛ الإعلانات | `js/seller/marketing.js` |
| `#canvas` | تجهيز الصورة للبحث بالصورة (تصغير + JPEG) | `js/features/search.js` |
| `#card-gallery` | تبديل صور المنتج عند مرور المؤشر | `js/ui/card-motion.js` |
| `#card-motion` | أشكال الكروت والحركة والظهور التدريجي | `js/ui/card-motion.js` |
| `#cards` | — | `css/panel.css` |
| `#cart` | تخطيط السلة والدفع وملخص الطلب؛ إضافة وحذف المنتجات وحساب الشحن | `cart.html`, `css/components/product-card-motion.css`, `css/pages/inner-pages.css`, `js/features/cart.js` (+2) |
| `#cart-badge` | الهيدر وشريط الأقسام | `js/ui/header.js` |
| `#cart-fx` | نبضة الزر والصورة الطايرة وbounce السلة | `js/ui/cart-fx.js` |
| `#catalog` | صفحة القسم والعروض؛ المنتجات ونتائج البحث (نصي وبالصورة) | `js/pages/catalog.js` |
| `#categories` | شريط الأقسام بدون سكرول + زر "المزيد"؛ الصفحة الرئيسية | `css/layout/catnav-more.css`, `css/pages/home.css`, `js/admin/categories.js`, `js/core/data.js` (+2) |
| `#category` | صفحة القسم والعروض؛ المنتجات ونتائج البحث (نصي وبالصورة) | `category/index.html`, `js/pages/catalog.js` |
| `#category-chips` | غلاف صفحات القوائم (الأقسام والعروض) وشريحة الأق | `js/ui/list-parts.js` |
| `#category-icons` | أيقونات صور (3D) للأقسام والعروض وحالات الطلب؛ أيقونات SVG وصور الأقسام والنجوم | `css/components/media.css`, `js/ui/icons.js` |
| `#catnav` | شريط الأقسام بدون سكرول + زر "المزيد"؛ الهيدر والبحث وشريط الأقسام | `css/layout/catnav-more.css`, `css/layout/header.css` |
| `#charts` | التحليلات؛ تواريخ ورسوم بيانية SVG وتصدير CSV | `js/admin/analytics.js`, `js/panel/charts.js`, `js/seller/analytics.js` |
| `#checkout` | تخطيط السلة والدفع وملخص الطلب؛ اختيار طريقة الدفع | `checkout.html`, `css/pages/inner-pages.css`, `js/pages/checkout.js`, `order-success.html` |
| `#chips` | أزرار وحقول وتنبيهات وchips وسكلتون وtoast؛ أدوات عامة صغيرة | `css/components/ui-kit.css`, `css/layout/footer.css` |
| `#click` | ربط زر الإضافة للسلة (event delegation) | `js/ui/cart-fx.js` |
| `#client` | عميل قاعدة البيانات | `js/core/supabase.js` |
| `#config` | بانر الرئيسية المتبدّل مع الأيام | `js/core/config.js`, `js/pages/home.js` |
| `#confirm` | مكوّنات الواجهة المشتركة | `js/panel/ui.js` |
| `#contact` | الرسائل؛ تواصل / 404 / تحويل السياسات القديمة | `contact.html`, `js/admin/messages.js`, `js/pages/contact-404.js` |
| `#csv` | تواريخ ورسوم بيانية SVG وتصدير CSV | `js/panel/charts.js` |
| `#customers` | العملاء | `js/admin/customers.js` |
| `#data` | استعلامات Supabase وكاش المنتجات والأقسام | `js/core/data.js` |
| `#date` | دوال صغيرة مشتركة (تاريخ عربي، قراءة JSON، نجمة) | `js/features/reviews.js` |
| `#dates` | تواريخ ورسوم بيانية SVG وتصدير CSV | `js/panel/charts.js` |
| `#debounce` | تحميل تدريجي ودوال مساعدة للبحث | `js/panel/list-tools.js` |
| `#default-variant` | — | `css/components/product-card-motion.css` |
| `#details` | المتجر (بيانات، منتجات، صور، أموال) | `js/stuff/store.js` |
| `#dialog` | جداول ونوافذ حوار | `css/components/tables-dialogs.css` |
| `#discount` | تفاصيل أخيرة (اتجاه الخصم وشبكة الكروت)؛ بطاقة المنتج والسكلتون وصور المنتج | `css/components/banner-skeleton.css`, `js/ui/cards.js` |
| `#discover` | مختارة لك حسب اهتمام العميل؛ الصفحة الرئيسية | `js/features/discover.js`, `js/pages/home.js` |
| `#distribution` | تقييمات المنتج | `css/components/reviews.css` |
| `#dom` | دوال مساعدة عامة | `js/core/utils.js` |
| `#domcontentloaded` | سجل الصفحات والإقلاع | `js/core/boot.js` |
| `#empty-state` | صور الحالات الفاضية؛ مكوّنات الواجهة المشتركة | `css/pages/states-about.css`, `js/panel/ui.js`, `js/ui/states.js` |
| `#error-box` | صناديق الخطأ والحالات الفاضية وتسميات الحالات | `js/ui/states.js` |
| `#escape-html` | دوال مساعدة عامة | `js/core/utils.js` |
| `#faq` | مركز المساعدة | `css/pages/help-legal-join.css`, `help/index.html`, `js/pages/help.js` |
| `#feedback` | إشعارات مؤقتة | `js/ui/toast.js` |
| `#fly-to-cart` | نبضة الزر والصورة الطايرة وbounce السلة | `css/components/product-card-motion.css`, `js/ui/cart-fx.js` |
| `#focus` | بدون المربع الأزرق/الأخضر عند اللمس على الموبايل | `css/components/media-box-focus.css` |
| `#footer` | الفوتر وتفضيل تقليل الحركة (عام لكل الصفحات)؛ تبويبات الموبايل والفوتر | `404.html`, `about/index.html`, `account.html`, `auth.html` (+22) |
| `#form` | الاشتراك في العروض؛ تقييمات المنتج | `css/components/newsletter.css`, `css/components/reviews.css`, `js/features/reviews.js` |
| `#format` | دوال مساعدة عامة؛ عميل Supabase المستقل وأدوات التنسيق | `js/core/utils.js`, `js/panel/core.js` |
| `#forms` | أزرار وحقول وتنبيهات وchips وسكلتون وtoast؛ ثوابت وأدوات مشتركة | `css/components/ui-kit.css`, `css/panel.css`, `js/seller/shared.js` |
| `#gallery` | صفحة المنتج (الصورة والمعلومات والكمية والضمانات؛ صفحة تفاصيل المنتج | `css/pages/inner-pages.css`, `js/pages/product.js` |
| `#glass` | كبسولة عايمة بتأثير الزجاج (زي iOS) | `css/components/tabbar-glass.css` |
| `#grid` | عرض شبكة / قائمة (زي أمازون)؛ شبكة المنتجات والبطاقة | `css/components/product-card-motion.css`, `css/components/product-card-v2.css`, `css/components/product-card.css`, `css/components/quick-cards.css` |
| `#guard` | الحماية والدخول (حساب مستقل)؛ الحماية وحالة المتجر | `js/admin/auth.js`, `js/seller/auth.js`, `js/stuff/auth.js` |
| `#hashtag` | الهيدر والبحث وشريط الأقسام؛ هاشتاج الصفحة (نص عربي ظاهر للمستخدم، غير وسوم ا | `css/layout/header.css`, `js/ui/header.js` |
| `#header` | شريط علوي أصغر + بانر سلايدر أصغر + كارت منتج بس؛ شريط الأقسام بدون سكرول + زر "المزيد" | `404.html`, `about/index.html`, `account.html`, `auth.html` (+26) |
| `#help` | مركز المساعدة؛ المساعدة | `css/pages/help-legal-join.css`, `help/index.html`, `js/pages/help.js`, `js/seller/settings.js` (+1) |
| `#helpers` | دوال صغيرة مشتركة (تاريخ عربي، قراءة JSON، نجمة)؛ ثوابت وأدوات مشتركة | `js/features/reviews.js`, `js/seller/shared.js`, `js/stuff/shared.js` |
| `#history-api` | الراوتر وهيكل اللوحة | `js/panel/router.js` |
| `#home` | بانر الرئيسية (أصغر ومتوسّط، وبيتبدّل fade)؛ كروت مربعة لكل قسم + عروض (الرئيسية) | `css/components/banner-skeleton.css`, `css/components/quick-cards.css`, `css/pages/home.css`, `index.html` (+1) |
| `#hover` | تبديل صور المنتج عند مرور المؤشر | `css/components/product-card-motion.css`, `js/ui/card-motion.js` |
| `#icons` | ثوابت وأدوات مشتركة؛ أيقونات SVG وصور الأقسام والنجوم | `js/stuff/shared.js`, `js/ui/icons.js` |
| `#image` | سكلتون الصور يلمع لحد ما الصورة تحمّل؛ رفع الصور وحقل الصورة | `css/components/banner-skeleton.css`, `js/panel/uploads.js` |
| `#image-box` | صندوق صورة مربع ثابت في كل الكروت (الصورة جوّاه  | `css/components/media-box-focus.css`, `css/components/product-card-motion.css` |
| `#image-search` | تجهيز الصورة للبحث بالصورة (تصغير + JPEG)؛ المنتجات ونتائج البحث (نصي وبالصورة) | `js/features/search.js`, `js/pages/catalog.js`, `js/ui/search-box.js` |
| `#images` | أيقونات صور (3D) للأقسام والعروض وحالات الطلب؛ صفحة السياسات (صورة لكل بند) | `css/components/media.css`, `css/pages/payment-legal-track-auth.css`, `css/pages/states-about.css`, `js/stuff/store.js` |
| `#imgph` | سكلتون الصور يلمع لحد ما الصورة تحمّل؛ بطاقة المنتج والسكلتون وصور المنتج | `css/components/banner-skeleton.css`, `js/ui/cards.js` |
| `#infinite-load` | تحميل تدريجي ودوال مساعدة للبحث | `js/panel/list-tools.js` |
| `#inner-pages` | الصفحات الداخلية (عناوين وشريط أدوات وفتات الخبز | `css/pages/inner-pages.css` |
| `#install` | بانر تثبيت التطبيق؛ بانر تثبيت التطبيق وتسجيل الـ Service Worker | `css/components/install-banner.css`, `js/features/install.js` |
| `#intersection-observer` | أشكال الكروت والحركة والظهور التدريجي | `js/ui/card-motion.js` |
| `#ios` | كبسولة عايمة بتأثير الزجاج (زي iOS)؛ كشف وضع التطبيق المثبّت و iOS | `css/components/tabbar-glass.css`, `js/core/utils.js`, `js/features/install.js` |
| `#join-us` | انضم إلينا؛ من نحن | `css/pages/help-legal-join.css`, `join-us/index.html`, `js/pages/join-about.js` |
| `#json` | دوال صغيرة مشتركة (تاريخ عربي، قراءة JSON، نجمة) | `js/features/reviews.js` |
| `#kt-admins` | دخول وإنشاء حساب الفريق والأدمن | `js/panel/staff-auth.js` |
| `#layout` | تخطيط السلة والدفع وملخص الطلب | `css/pages/inner-pages.css`, `css/panel.css` |
| `#legacy-redirect` | تواصل / 404 / تحويل السياسات القديمة | `js/pages/contact-404.js` |
| `#legal` | صفحات السياسات؛ صفحة السياسات (صورة لكل بند) | `css/pages/help-legal-join.css`, `css/pages/inner-pages.css`, `css/pages/payment-legal-track-auth.css`, `js/pages/legal.js` (+3) |
| `#levenshtein` | بحث عربي مرن واقتراحات ذكية | `js/features/search.js` |
| `#links` | الفوتر وتفضيل تقليل الحركة (عام لكل الصفحات) | `css/layout/footer.css` |
| `#list` | عرض شبكة / قائمة (زي أمازون) | `css/components/product-card-v2.css` |
| `#list-page` | صفحة القسم والعروض؛ عنوان القسم والترتيب وعرض الشبكة/القائمة | `category/index.html`, `js/pages/catalog.js`, `js/ui/list-parts.js`, `offers/index.html` |
| `#list-shell` | غلاف صفحات القوائم (الأقسام والعروض) وشريحة الأق | `js/ui/list-parts.js` |
| `#list-view` | — | `css/components/product-card-motion.css` |
| `#localstorage` | إضافة وحذف المنتجات وحساب الشحن؛ مختارة لك حسب اهتمام العميل | `js/features/cart.js`, `js/features/discover.js`, `js/pages/cart.js`, `js/pages/home.js` |
| `#login` | كارت مركزي (الدخول/الكود/التبويبات)؛ تسجيل الدخول بخلفية صورة مموّهة (blur) | `auth.html`, `css/pages/inner-pages.css`, `css/pages/payment-legal-track-auth.css`, `css/panel.css` (+5) |
| `#manage` | كروت المتاجر وطلبات البائعين | `js/admin/stores.js` |
| `#marketing` | الحملات | `js/seller/marketing.js` |
| `#messages` | الرسائل | `js/admin/messages.js` |
| `#mobile-nav` | كبسولة عايمة بتأثير الزجاج (زي iOS)؛ تبويبات الموبايل وsheet الأقسام | `css/components/tabbar-glass.css`, `css/components/tabbar.css`, `js/ui/footer.js` |
| `#modal` | جداول ونوافذ حوار؛ مكوّنات الواجهة المشتركة | `css/components/tables-dialogs.css`, `js/panel/ui.js` |
| `#money` | الأموال؛ المتجر (بيانات، منتجات، صور، أموال) | `js/admin/money.js`, `js/stuff/store.js` |
| `#more` | شريط الأقسام بدون سكرول + زر "المزيد" | `css/layout/catnav-more.css` |
| `#mount` | قسم التقييمات داخل صفحة المنتج | `js/features/reviews.js` |
| `#my-orders` | البروفايل والطلبات والتتبع؛ حسابي وطلباتي وتقييماتي | `css/pages/profile.css`, `js/pages/profile.js`, `profile/my-orders/index.html` |
| `#my-reviews` | حسابي وطلباتي وتقييماتي | `js/pages/profile.js`, `profile/my-reviews/index.html` |
| `#nav` | الهيدر وشريط الأقسام | `404.html`, `about/index.html`, `account.html`, `auth.html` (+21) |
| `#navigation` | الراوتر وهيكل اللوحة | `js/panel/router.js` |
| `#newsletter` | الاشتراك في العروض؛ الاشتراك في العروض (آخر الرئيسية) | `css/components/newsletter.css`, `js/pages/home.js` |
| `#no-motion` | — | `css/components/product-card-motion.css` |
| `#no-results` | صور الحالات الفاضية | `css/pages/states-about.css` |
| `#not-found` | تواصل / 404 / تحويل السياسات القديمة | `404.html`, `js/pages/contact-404.js` |
| `#notification` | إشعارات مؤقتة | `js/ui/toast.js` |
| `#offers` | صفحة القسم والعروض؛ الصفحة الرئيسية | `js/pages/catalog.js`, `js/pages/home.js`, `js/pages/yours.js`, `offers/index.html` |
| `#order` | خطوات الطلب والحالة وكارت الطلب؛ إتمام الطلب والدفع وصفحة النجاح | `css/pages/inner-pages.css`, `js/pages/checkout.js`, `js/pages/track.js` |
| `#order-card` | تتبع الطلب | `js/pages/track.js` |
| `#order-details` | الطلبات وصفحة تفاصيل الطلب | `css/panel.css`, `js/admin/orders.js` |
| `#order-status` | أيقونات صور (3D) للأقسام والعروض وحالات الطلب؛ حالات الطلب والمتجر والمنتج والإعلان | `css/components/media.css`, `js/panel/ui.js`, `js/ui/states.js` |
| `#order-success` | إتمام الطلب والدفع وصفحة النجاح | `js/pages/checkout.js`, `order-success.html` |
| `#order-summary` | تخطيط السلة والدفع وملخص الطلب | `css/pages/inner-pages.css` |
| `#order-tracking` | تتبع الطلب؛ البروفايل والطلبات والتتبع | `css/pages/payment-legal-track-auth.css`, `css/pages/profile.css`, `track.html` |
| `#orders` | الطلبات وصفحة تفاصيل الطلب؛ تحميل المبيعات وتجميعها (kt_sales_lines) | `js/admin/orders.js`, `js/panel/charts.js`, `js/seller/orders.js` |
| `#otp` | كارت مركزي (الدخول/الكود/التبويبات)؛ تسجيل الدخول وإنشاء الحساب | `css/pages/inner-pages.css`, `js/pages/auth.js` |
| `#overview` | نظرة عامة | `js/admin/overview.js`, `js/seller/overview.js` |
| `#page` | الصفحات الداخلية (عناوين وشريط أدوات وفتات الخبز؛ من نحن | `404.html`, `about/index.html`, `account.html`, `admin/index.html` (+29) |
| `#page-tag` | هاشتاج الصفحة (نص عربي ظاهر للمستخدم، غير وسوم ا | `js/ui/header.js` |
| `#pager` | المنتجات (تحميل تدريجي)؛ تحميل تدريجي ودوال مساعدة للبحث | `js/admin/products.js`, `js/panel/list-tools.js` |
| `#pages` | سجل الصفحات والإقلاع | `js/core/boot.js` |
| `#pages-registry` | ثوابت وأدوات مشتركة وسجل الصفحات؛ سجل صفحات اللوحة | `js/admin/shared.js`, `js/seller/shared.js`, `js/stuff/shared.js` |
| `#panel` | — | `css/panel.css` |
| `#panel-auth` | — | `css/panel.css` |
| `#panel-components` | — | `css/panel.css` |
| `#panel-core` | عميل Supabase المستقل وأدوات التنسيق | `js/panel/core.js` |
| `#panel-icons` | أيقونات اللوحة (stroke) | `js/panel/core.js` |
| `#panel-mobile` | — | `css/panel.css` |
| `#panel-router` | الراوتر وهيكل اللوحة | `js/panel/router.js` |
| `#panel-shell` | — | `admin/index.html`, `be-seller/index.html`, `css/panel.css`, `stuff/index.html` |
| `#panel-status` | حالات الطلب والمتجر والمنتج والإعلان | `js/panel/ui.js` |
| `#panel-ui` | مكوّنات الواجهة المشتركة | `js/panel/ui.js` |
| `#partner-store` | المتاجر الشريكة والإعلانات؛ صفحة المتجر الشريك | `css/pages/partner-store.css`, `js/pages/partner-store.js`, `store/index.html` |
| `#pay` | اختيار طريقة الدفع | `css/pages/inner-pages.css` |
| `#paybox` | صندوق الدفع | `css/pages/inner-pages.css` |
| `#payment` | صندوق الدفع؛ إتمام الطلب والدفع وصفحة النجاح | `checkout.html`, `css/pages/inner-pages.css`, `js/pages/checkout.js` |
| `#payment-logos` | وسائل الدفع؛ لوجوهات وسائل الدفع | `css/pages/payment-legal-track-auth.css`, `js/ui/cards.js` |
| `#payment-methods` | اختيار طريقة الدفع | `css/pages/inner-pages.css` |
| `#payment-names` | صناديق الخطأ والحالات الفاضية وتسميات الحالات | `js/ui/states.js` |
| `#payments` | وسائل الدفع؛ لوجوهات وسائل الدفع | `css/pages/payment-legal-track-auth.css`, `js/core/config.js`, `js/ui/cards.js` |
| `#payouts` | الأموال؛ المدفوعات | `js/admin/money.js`, `js/seller/payouts.js` |
| `#perks` | الصفحة الرئيسية | `css/pages/home.css` |
| `#personalization` | مختارة لك حسب اهتمام العميل؛ عروضك حسب اهتمامك (السلة، اللي شاهدته، واللي اشت | `js/features/discover.js`, `js/pages/yours.js`, `yours-offer/index.html` |
| `#pgal` | تبديل صور المنتج | `css/components/media.css` |
| `#platform` | كشف وضع التطبيق المثبّت و iOS | `js/core/utils.js` |
| `#policy` | صفحات السياسات؛ صفحة السياسات (صورة لكل بند) | `css/pages/inner-pages.css`, `css/pages/payment-legal-track-auth.css`, `js/pages/legal.js`, `policies.html` (+1) |
| `#postgrest` | تحميل تدريجي ودوال مساعدة للبحث | `js/panel/list-tools.js` |
| `#preview` | رفع الصور وحقل الصورة | `js/panel/uploads.js` |
| `#price` | كارت المنتج بسيط وفيه كل المعلومات؛ شبكة المنتجات والبطاقة | `css/components/product-card-v2.css`, `css/components/product-card.css` |
| `#privacy` | السياسات والخصوصية | `js/pages/legal.js`, `privacy/index.html` |
| `#product` | صفحة المنتج (الصورة والمعلومات والكمية والضمانات؛ قسم التقييمات داخل صفحة المنتج | `css/pages/inner-pages.css`, `js/features/reviews.js`, `js/pages/product.js`, `product.html` |
| `#product-card` | تفاصيل أخيرة (اتجاه الخصم وشبكة الكروت)؛ صندوق صورة مربع ثابت في كل الكروت (الصورة جوّاه  | `css/components/banner-skeleton.css`, `css/components/media-box-focus.css`, `css/components/product-card-motion.css`, `css/components/product-card-v2.css` (+4) |
| `#product-form` | المنتجات (تحميل تدريجي)؛ نموذج المنتج (مشترك: البائع + الأدمن) | `js/admin/products.js`, `js/panel/product-form.js`, `js/seller/products.js` |
| `#product-gallery` | تبديل صور المنتج | `css/components/media.css` |
| `#product-requests` | طلبات المنتجات | `js/admin/product-requests.js` |
| `#products` | المنتجات (تحميل تدريجي)؛ استعلامات Supabase وكاش المنتجات والأقسام | `js/admin/products.js`, `js/core/data.js`, `js/panel/product-form.js`, `js/seller/products.js` (+1) |
| `#profile` | البروفايل والطلبات والتتبع؛ تحويل صفحة الحساب القديمة | `account.html`, `css/pages/profile.css`, `js/pages/auth.js`, `js/pages/profile.js` (+4) |
| `#pulse` | — | `css/components/product-card-motion.css` |
| `#pwa` | بانر تثبيت التطبيق؛ كشف وضع التطبيق المثبّت و iOS | `css/components/install-banner.css`, `js/core/utils.js`, `js/features/install.js` |
| `#qty` | صفحة المنتج (الصورة والمعلومات والكمية والضمانات | `css/pages/inner-pages.css` |
| `#quantity` | صفحة السلة | `js/pages/cart.js` |
| `#quick-cards` | تفاصيل أخيرة (اتجاه الخصم وشبكة الكروت)؛ كروت مربعة لكل قسم + عروض (الرئيسية) | `css/components/banner-skeleton.css`, `css/components/quick-cards.css` |
| `#rail` | شبكة المنتجات والبطاقة | `css/components/product-card.css` |
| `#rating` | كارت المنتج بسيط وفيه كل المعلومات؛ تقييمات المنتج | `css/components/product-card-v2.css`, `css/components/reviews.css`, `js/features/reviews.js` |
| `#recently-viewed` | آخر المنتجات المشاهدة | `js/features/discover.js` |
| `#recommendations` | مختارة لك حسب اهتمام العميل | `js/features/discover.js` |
| `#redirect` | تحويل صفحة الحساب القديمة | `js/pages/auth.js` |
| `#reduced-motion` | الفوتر وتفضيل تقليل الحركة (عام لكل الصفحات) | `css/components/product-card-motion.css`, `css/layout/footer.css` |
| `#require-login` | جلسة العميل وحماية الصفحات | `js/core/supabase.js` |
| `#reset` | المتغيرات والـ reset والعناصر العامة | `css/base.css` |
| `#responsive` | — | `css/panel.css` |
| `#reveal` | أشكال الكروت والحركة والظهور التدريجي | `css/components/product-card-motion.css`, `js/ui/card-motion.js` |
| `#review` | طلبات المنتجات | `js/admin/product-requests.js` |
| `#reviews` | تقييمات المنتج؛ تقييمات المنتجات (التحقق في قاعدة البيانات) | `css/components/reviews.css`, `js/features/reviews.js`, `js/pages/product.js`, `product.html` |
| `#root` | المتغيرات والـ reset والعناصر العامة | `css/base.css` |
| `#route` | الإعلانات؛ التحليلات | `js/admin/ads.js`, `js/admin/analytics.js`, `js/admin/categories.js`, `js/admin/customers.js` (+31) |
| `#router` | تسجيل اللوحة في الراوتر؛ سجل الصفحات والإقلاع | `js/admin/index.js`, `js/core/boot.js`, `js/seller/index.js`, `js/stuff/index.js` |
| `#sales` | التحليلات؛ تحميل المبيعات وتجميعها (kt_sales_lines) | `js/admin/analytics.js`, `js/panel/charts.js`, `js/seller/analytics.js` |
| `#scroll` | — | `css/components/product-card-motion.css` |
| `#search` | صندوق البحث الذكي؛ بحث عربي مرن واقتراحات ذكية | `css/pages/inner-pages.css`, `js/features/search.js`, `js/pages/catalog.js`, `shop.html` |
| `#search-bar` | — | `404.html`, `about/index.html`, `account.html`, `auth.html` (+20) |
| `#search-box` | الهيدر والبحث وشريط الأقسام؛ اقتراحات البحث والبحث بالصورة في الهيدر | `css/layout/header.css`, `js/ui/search-box.js` |
| `#section-head` | عنوان القسم والترتيب وعرض الشبكة/القائمة | `js/ui/list-parts.js` |
| `#sections` | الصفحة الرئيسية | `css/pages/home.css` |
| `#seller` | انضم إلينا؛ نموذج المنتج (مشترك: البائع + الأدمن) | `be-seller/index.html`, `css/panel.css`, `js/pages/join-about.js`, `js/panel/product-form.js` (+11) |
| `#seller-request` | كروت المتاجر وطلبات البائعين | `js/admin/stores.js` |
| `#sellers` | طلبات المنتجات | `js/admin/product-requests.js` |
| `#service-worker` | بانر تثبيت التطبيق وتسجيل الـ Service Worker | `js/features/install.js` |
| `#session` | جلسة العميل وحماية الصفحات | `js/core/supabase.js` |
| `#settings` | الإعدادات؛ المساعدة | `js/seller/settings.js` |
| `#shared` | ثوابت وأدوات مشتركة وسجل الصفحات؛ ثوابت وأدوات مشتركة | `js/admin/shared.js`, `js/seller/shared.js`, `js/stuff/shared.js` |
| `#sheet` | تبويبات الموبايل وsheet الأقسام | `css/components/tabbar.css` |
| `#shell` | الراوتر وهيكل اللوحة | `js/panel/router.js` |
| `#shimmer` | — | `css/components/product-card-motion.css` |
| `#shipping` | إضافة وحذف المنتجات وحساب الشحن؛ إتمام الطلب والدفع وصفحة النجاح | `js/core/config.js`, `js/features/cart.js`, `js/pages/checkout.js` |
| `#shipping-strip` | الصفحة الرئيسية | `css/pages/home.css` |
| `#shop` | المنتجات ونتائج البحث (نصي وبالصورة) | `js/pages/catalog.js`, `shop.html` |
| `#side-art` | — | `css/panel.css` |
| `#sidebar` | — | `css/panel.css` |
| `#signup` | تسجيل الدخول وإنشاء الحساب؛ دخول وإنشاء حساب الفريق والأدمن | `css/panel.css`, `js/pages/auth.js`, `js/panel/staff-auth.js`, `js/seller/auth.js` |
| `#skeleton` | سكلتون الصور يلمع لحد ما الصورة تحمّل؛ أزرار وحقول وتنبيهات وchips وسكلتون وtoast | `css/components/banner-skeleton.css`, `css/components/product-card-motion.css`, `css/components/ui-kit.css`, `js/panel/ui.js` (+1) |
| `#slider` | بانر الرئيسية (أصغر ومتوسّط، وبيتبدّل fade)؛ بانر الرئيسية المتبدّل مع الأيام | `css/components/banner-skeleton.css`, `js/pages/home.js` |
| `#sort` | عنوان القسم والترتيب وعرض الشبكة/القائمة | `js/ui/list-parts.js` |
| `#sponsored` | المتاجر الشريكة والإعلانات؛ الإعلانات | `css/pages/partner-store.css`, `js/admin/ads.js`, `js/features/ads.js`, `js/seller/marketing.js` |
| `#sr-only` | أدوات عامة صغيرة | `css/layout/footer.css` |
| `#staff-auth` | دخول وإنشاء حساب الفريق والأدمن | `js/panel/staff-auth.js` |
| `#stars` | شبكة المنتجات والبطاقة؛ أيقونات SVG وصور الأقسام والنجوم | `css/components/product-card.css`, `js/ui/icons.js` |
| `#stats` | نظرة عامة | `js/admin/overview.js`, `js/seller/overview.js` |
| `#status` | خطوات الطلب والحالة وكارت الطلب | `css/pages/inner-pages.css` |
| `#status-steps` | تتبع الطلب | `js/pages/track.js` |
| `#steps` | خطوات الطلب والحالة وكارت الطلب | `css/pages/inner-pages.css` |
| `#stock` | صفحة المنتج (الصورة والمعلومات والكمية والضمانات | `css/pages/inner-pages.css` |
| `#storage` | رفع الصور وحقل الصورة | `js/panel/uploads.js` |
| `#store` | صفحة المتجر الشريك؛ المتجر | `js/pages/partner-store.js`, `js/seller/store.js`, `js/stuff/store.js` |
| `#store-cards` | — | `css/panel.css` |
| `#store-header` | المتاجر الشريكة والإعلانات | `css/pages/partner-store.css` |
| `#store-status` | الحماية وحالة المتجر | `js/seller/auth.js` |
| `#stores` | كروت المتاجر وطلبات البائعين | `css/panel.css`, `js/admin/stores.js` |
| `#stuff` | الدخول والحماية؛ طلبات المساعدة | `css/panel.css`, `js/stuff/auth.js`, `js/stuff/help.js`, `js/stuff/index.js` (+4) |
| `#subhead` | عنوان فرعي | `css/pages/inner-pages.css` |
| `#subscribe` | الاشتراك في العروض؛ الاشتراك في العروض (آخر الرئيسية) | `css/components/newsletter.css`, `js/pages/home.js` |
| `#suggestions` | الهيدر والبحث وشريط الأقسام؛ اقتراحات البحث والبحث بالصورة في الهيدر | `css/layout/header.css`, `js/ui/search-box.js` |
| `#summary` | صفحة السلة | `js/pages/cart.js` |
| `#supabase` | استعلامات Supabase وكاش المنتجات والأقسام؛ عميل قاعدة البيانات | `js/core/config.js`, `js/core/data.js`, `js/core/supabase.js`, `js/pages/auth.js` (+1) |
| `#support` | مركز المساعدة؛ المساعدة | `js/pages/help.js`, `js/seller/settings.js`, `js/stuff/help.js` |
| `#svg` | تواريخ ورسوم بيانية SVG وتصدير CSV؛ أيقونات اللوحة (stroke) | `js/panel/charts.js`, `js/panel/core.js`, `js/ui/icons.js` |
| `#synonyms` | بحث عربي مرن واقتراحات ذكية | `js/features/search.js` |
| `#tabbar` | كبسولة عايمة بتأثير الزجاج (زي iOS)؛ تبويبات الموبايل وsheet الأقسام | `404.html`, `about/index.html`, `account.html`, `auth.html` (+24) |
| `#tables` | جداول ونوافذ حوار؛ ثوابت وأدوات مشتركة | `css/components/tables-dialogs.css`, `css/panel.css`, `js/seller/shared.js` |
| `#tabs` | كارت مركزي (الدخول/الكود/التبويبات) | `css/pages/inner-pages.css` |
| `#tap-highlight` | بدون المربع الأزرق/الأخضر عند اللمس على الموبايل | `css/components/media-box-focus.css` |
| `#team` | من نحن؛ انضم إلينا | `css/pages/states-about.css`, `js/pages/join-about.js`, `js/stuff/team.js` |
| `#thumbs` | تبديل صور المنتج | `css/components/media.css` |
| `#tickets` | طلبات المساعدة | `js/stuff/help.js` |
| `#tilt` | — | `css/components/product-card-motion.css` |
| `#toast` | أزرار وحقول وتنبيهات وchips وسكلتون وtoast؛ مكوّنات الواجهة المشتركة | `css/components/ui-kit.css`, `js/panel/ui.js`, `js/ui/toast.js` |
| `#toolbar` | الصفحات الداخلية (عناوين وشريط أدوات وفتات الخبز | `css/pages/inner-pages.css` |
| `#topstrip` | شريط علوي أصغر + بانر سلايدر أصغر + كارت منتج بس | `css/components/banner-skeleton.css` |
| `#touch` | — | `css/components/product-card-motion.css` |
| `#track` | خطوات الطلب والحالة وكارت الطلب؛ تتبع الطلب | `css/pages/inner-pages.css`, `css/pages/payment-legal-track-auth.css`, `js/pages/track.js`, `track.html` |
| `#tracking` | الإعلانات المموّلة وتسجيل الأحداث | `js/features/ads.js` |
| `#trust` | من نحن | `js/pages/join-about.js` |
| `#typography` | عنوان فرعي | `css/pages/inner-pages.css` |
| `#updates` | شريط علوي أصغر + بانر سلايدر أصغر + كارت منتج بس | `css/components/banner-skeleton.css` |
| `#upload` | تجهيز الصورة للبحث بالصورة (تصغير + JPEG) | `js/features/search.js` |
| `#uploads` | رفع الصور وحقل الصورة | `js/panel/uploads.js` |
| `#utilities` | أدوات عامة صغيرة | `css/layout/footer.css` |
| `#utils` | دوال مساعدة عامة | `js/core/utils.js` |
| `#variables` | المتغيرات والـ reset والعناصر العامة | `css/base.css` |
| `#variants` | أشكال الكروت والحركة والظهور التدريجي | `css/components/product-card-motion.css`, `js/ui/card-motion.js` |
| `#verified-buyer` | تقييمات المنتجات (التحقق في قاعدة البيانات) | `js/features/reviews.js` |
| `#view-mode` | عنوان القسم والترتيب وعرض الشبكة/القائمة | `js/ui/list-parts.js` |
| `#view-switch` | عرض شبكة / قائمة (زي أمازون) | `css/components/product-card-v2.css` |
| `#whatsapp` | الطلبات وصفحة تفاصيل الطلب | `js/admin/orders.js` |
| `#yours-offer` | عروضك حسب اهتمامك (السلة، اللي شاهدته، واللي اشت | `js/pages/yours.js`, `yours-offer/index.html` |

## وسوم مسارات الصفحات (`#page-*`)

| الوسم | الملف |
|---|---|
| `#page-about` | `js/pages/join-about.js` |
| `#page-account` | `js/pages/auth.js` |
| `#page-ads` | `js/admin/ads.js`, `js/seller/marketing.js` |
| `#page-analytics` | `js/admin/analytics.js`, `js/seller/analytics.js` |
| `#page-auth` | `js/pages/auth.js` |
| `#page-campaigns` | `js/seller/marketing.js` |
| `#page-cart` | `js/pages/cart.js` |
| `#page-categories` | `js/admin/categories.js` |
| `#page-category` | `js/pages/catalog.js` |
| `#page-checkout` | `js/pages/checkout.js` |
| `#page-contact` | `js/pages/contact-404.js` |
| `#page-customers` | `js/admin/customers.js` |
| `#page-details` | `js/stuff/store.js` |
| `#page-help` | `js/pages/help.js`, `js/seller/settings.js`, `js/stuff/help.js` |
| `#page-help-all` | `js/stuff/help.js` |
| `#page-help-seller` | `js/stuff/help.js` |
| `#page-help-users` | `js/stuff/help.js` |
| `#page-home` | `js/pages/home.js` |
| `#page-images` | `js/stuff/store.js` |
| `#page-join` | `js/pages/join-about.js` |
| `#page-messages` | `js/admin/messages.js` |
| `#page-money` | `js/admin/money.js`, `js/stuff/store.js` |
| `#page-myorders` | `js/pages/profile.js` |
| `#page-myreviews` | `js/pages/profile.js` |
| `#page-notfound` | `js/pages/contact-404.js` |
| `#page-offers` | `js/pages/catalog.js` |
| `#page-order-details` | `js/admin/orders.js` |
| `#page-orders` | `js/seller/orders.js` |
| `#page-overview` | `js/admin/overview.js`, `js/seller/overview.js` |
| `#page-payouts` | `js/seller/payouts.js` |
| `#page-policies` | `js/pages/contact-404.js` |
| `#page-policy` | `js/pages/legal.js` |
| `#page-privacy` | `js/pages/legal.js` |
| `#page-product` | `js/pages/product.js` |
| `#page-products` | `js/admin/products.js`, `js/seller/products.js`, `js/stuff/store.js` |
| `#page-profile` | `js/pages/profile.js` |
| `#page-seller-request` | `js/admin/stores.js` |
| `#page-settings` | `js/seller/settings.js` |
| `#page-shop` | `js/pages/catalog.js` |
| `#page-store` | `js/pages/partner-store.js`, `js/seller/store.js`, `js/stuff/store.js` |
| `#page-stores` | `js/admin/stores.js` |
| `#page-success` | `js/pages/checkout.js` |
| `#page-team` | `js/stuff/team.js` |
| `#page-track` | `js/pages/track.js` |
| `#page-yours` | `js/pages/yours.js` |
