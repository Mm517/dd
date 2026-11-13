/* Kitchenly - إعدادات المتجر. مفتاح anon مفتاح عام للمتصفح (محمي بـ RLS). لا تضع هنا service_role أبدًا. */
window.KT = {
  url: 'https://cijujqhxdjpvuyzbxedf.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpanVqcWh4ZGpwdnV5emJ4ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MTU3NjgsImV4cCI6MjEwODI5MTc2OH0.GEF6l_B-6xPfcoct2qE_tU_v4n4vpHtdSWyGDioc4CE',
  phone: '+20 10 1234 5678',
  whatsapp: '201012345678',
  shippingFee: 40,                   // لازم يطابق kt_place_order في قاعدة البيانات
  freeShipFrom: 500,
  /* بانرات الرئيسية: بتتبدّل مع الأيام وكل 6 ثواني. أضف بانر جديد بس بإضافة سطر هنا. */
  banners: [
    { image: '/assets/img/banners/free-shipping.webp', href: '/shop.html', alt: 'شحن مجاني فوق 500 جنيه من Kitchenly' },
    { image: '/assets/img/banners/collections.webp', href: '/category/bundles', alt: 'المجموعات: كل ما تحتاجه في مكان واحد' }
    /* { image: '/assets/img/banners/new-product.webp', href: '/shop.html?sort=new', alt: 'منتج جديد' } */
  ],
  /* البحث الذكي (Supabase Edge Function ai-search + Gemini) */
  aiSearch: true,
  /* الدفع: اربطهم لاحقًا من هنا */
  payments: {
    online:   { enabled: true, label: 'دفع أونلاين', hint: 'بطاقة بنكية أو محفظة إلكترونية', checkoutUrl: '' },   // ضع رابط بوابة الدفع هنا (مثال: Paymob / Fawry)
    instapay: { enabled: true, label: 'إنستا باي',  hint: 'حوّل المبلغ عبر InstaPay', handle: '', phone: '' }            // ضع عنوان إنستا باي (name@instapay) أو رقم المحفظة هنا
  }
};
