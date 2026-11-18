import { BRAND } from '../config.js';
import { esc, safeUrl } from '../lib/util.js';
import { getMe, isStaff, login, register, resetPassword, errMsg } from '../lib/auth.js';
import { guard, toast } from '../lib/ui.js';

const homeOf = (u) => (isStaff(u) ? '#/teacher' : '#/levels');

export function viewHome({ app, institution }) {
  const u = getMe();
  const cta = u
    ? `<a class="btn gold" href="${homeOf(u)}">${isStaff(u) ? 'افتح لوحة التحكم' : 'تابع تعلّمك'}</a>`
    : `<a class="btn gold" href="#/register">ابدأ مجانًا</a><a class="btn ghost" href="#/login">تسجيل الدخول</a>`;
  const url = institution && safeUrl(institution.url);
  app.innerHTML = `
    <section class="hero">
      <img src="icon.svg" alt="شعار إعرابي">
      <h1>${esc(BRAND.name)}</h1>
      <div class="en">${esc(BRAND.nameEn)}</div>
      <p class="tagline">${esc(BRAND.tagline)}</p>
      <div class="actions">${cta}</div>
    </section>
    <section class="grid" aria-label="مميزات المنصة">
      <article class="card"><h3>مستويات متدرجة</h3><p>مسار واضح من المبتدئ إلى المتقدم، وكل مستوى مقسّم إلى جزئيات.</p></article>
      <article class="card"><h3>دروس وفيديوهات وملفات</h3><p>محتوى متنوع مرتبط بـ Google Drive: دروس مكتوبة وفيديوهات وملفات PDF.</p></article>
      <article class="card"><h3>اختبارات فورية</h3><p>اختبر نفسك بعد كل جزئية وتابع أفضل نتائجك.</p></article>
      <article class="card"><h3>تواصل مع المدرس</h3><p>راسل مدرّسيك داخل المنصة واحصل على الإجابة.</p></article>
    </section>
    ${url ? `<section class="card" style="margin-top:1rem;text-align:center"><p>${esc(institution.name || 'المؤسسة التعليمية')}</p><a class="btn ghost small" href="${esc(url)}" target="_blank" rel="noopener noreferrer">زيارة موقع المؤسسة</a></section>` : ''}`;
}

export function viewLogin({ app, go, banned }) {
  app.innerHTML = `
    <section class="card form">
      <h2>تسجيل الدخول إلى إعرابي</h2>
      ${banned ? '<div class="error">تم حظر حسابك. تواصل مع إدارة المنصة.</div>' : ''}
      <form id="f" novalidate>
        <label for="email">البريد الإلكتروني</label>
        <input id="email" type="email" autocomplete="email" required dir="ltr">
        <label for="pw">كلمة المرور</label>
        <input id="pw" type="password" autocomplete="current-password" required dir="ltr">
        <div id="err" class="error" hidden></div>
        <p><button class="btn" type="submit">دخول</button> <button class="btn ghost small" type="button" id="forgot">نسيت كلمة المرور؟</button></p>
      </form>
      <p class="hint">ليس لديك حساب؟ <a href="#/register">أنشئ حسابًا</a></p>
    </section>`;
  const f = document.getElementById('f');
  f.onsubmit = (e) => {
    e.preventDefault();
    guard(f.querySelector('[type=submit]'), 'err', async () => {
      const u = await login(f.email.value, f.pw.value);
      toast('أهلًا بك في إعرابي');
      go(homeOf(u));
    }, errMsg);
  };
  document.getElementById('forgot').onclick = () => guard(null, 'err', async () => {
    if (!f.email.value.trim()) throw new Error('أدخل بريدك الإلكتروني أولًا.');
    await resetPassword(f.email.value);
    toast('أُرسل رابط إعادة التعيين إلى بريدك');
  }, (e) => (e.code ? errMsg(e) : e.message));
}

export function viewRegister({ app, go }) {
  app.innerHTML = `
    <section class="card form">
      <h2>إنشاء حساب في إعرابي</h2>
      <form id="f" novalidate>
        <label for="name">الاسم الثلاثي</label>
        <input id="name" type="text" autocomplete="name" required placeholder="مثال: محمد أحمد علي">
        <p class="hint">اكتب اسمك ثلاثيًا كما يظهر لمدرّسك.</p>
        <label for="email">البريد الإلكتروني</label>
        <input id="email" type="email" autocomplete="email" required dir="ltr">
        <label for="pw">كلمة المرور (6 أحرف على الأقل)</label>
        <input id="pw" type="password" autocomplete="new-password" required dir="ltr">
        <div id="err" class="error" hidden></div>
        <p><button class="btn" type="submit">إنشاء الحساب</button></p>
      </form>
      <p class="hint">حسابات المدرسين تُنشأ بترقية من إدارة المنصة بعد التسجيل كطالب.</p>
      <p class="hint">لديك حساب؟ <a href="#/login">سجّل الدخول</a></p>
    </section>`;
  const f = document.getElementById('f');
  f.onsubmit = (e) => {
    e.preventDefault();
    guard(f.querySelector('[type=submit]'), 'err', async () => {
      const u = await register(f.name.value, f.email.value, f.pw.value);
      toast('تم إنشاء حسابك في إعرابي');
      go(homeOf(u));
    }, errMsg);
  };
}

export function viewMessage({ app, text }) { app.innerHTML = `<p class="empty">${esc(text)}</p>`; }
