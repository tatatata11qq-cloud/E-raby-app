# دليل تثبيت وتشغيل برنامج «إعرابي – نحو أكاديمي (E-raby)»

## أولًا: متطلبات التشغيل على Windows
- نظام التشغيل: **Windows 10** أو **Windows 11** (معمارية 64-bit).
- اتصال بالإنترنت: مطلوب للمزامنة مع Firebase Authentication وCloud Firestore وعرض روابط Google Drive والفيديوهات التفاعلية.
- مساحة تخزين فارغة: ~250 ميجابايت تقريبًا.

---

## ثانيًا: خطوات التثبيت عبر ملف التثبيت (`Eraby-Setup.exe`)
1. افتح مجلد **`Release`** داخل المشروع، وستجد بداخله ملف **`Eraby-Setup.exe`**.
2. انقر نقرًا مزدوجًا على **`Eraby-Setup.exe`**.
   - *(ملاحظة: إذا ظهرت نافذة Windows SmartScreen لأن الملف غير موقّع رقميًا بشهادة مدفوعة، اضغط على **More info** ثم **Run anyway** للمتابعة).*
3. اختر مسار التثبيت المناسب (أو اتركه على المسار الافتراضي) ثم اضغط **Install**.
4. بعد انتهاء التثبيت، ستظهر أيقونة **«إعرابي – نحو أكاديمي»** على سطح المكتب وفي قائمة ابدأ (Start Menu).
5. شغّل البرنامج وسيفتح مباشرة في نافذة مستقلة كاملة دون الحاجة إلى فتح المتصفح.

---

## ثالثًا: التشغيل المباشر بدون تثبيت (النسخة المحمولة `Eraby-Portable.exe`)
1. داخل مجلد **`Release`** أيضًا يوجد ملف **`Eraby-Portable.exe`**.
2. يمكنك نسخه إلى أي جهاز Windows آخر أو فلاش USB وتشغيله مباشرةً بنقرة مزدوجة دون أي خطوات تثبيت.

---

## رابعًا: التجهيز المستقبلي لإصدار Android APK
تم تجهيز ملف **`capacitor.config.json`** وتوافق مسارات `dist/` النسبية (`base: './'` و`HashRouter` عند التشغيل المحلي) بحيث يمكن مستقبلاً إصدار نسخة Android مستقلة عبر Capacitor دون أي تأثير على نسخة Windows:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
ومن Android Studio يمكنك بناء ملف `.apk` أو `.aab` مباشرة.
