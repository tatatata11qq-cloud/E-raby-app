import './styles.css';
import { configured, initAnalytics } from './lib/firebase.js';
import { initAuth, getMe, isStaff, logout, wasBanned, onMe } from './lib/auth.js';
import { getInstitution } from './lib/store.js';
import { esc } from './lib/util.js';
import { toast, showError } from './lib/ui.js';
import { viewHome, viewLogin, viewRegister, viewMessage } from './views/public.js';
import { viewLevels, viewLevel, viewContent } from './views/learn.js';
import { viewTeacher, viewTeacherLevel, viewTeacherContent, viewStudents } from './views/teacher.js';
import { viewMessages } from './views/messages.js';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
let institution = null;
let token = 0;

function renderNav() {
  const u = getMe();
  const here = location.hash || '#/';
  const link = (h, t) => `<a href="${h}" class="${here.startsWith(h) && h !== '#/' ? 'active' : ''}">${t}</a>`;
  const out = u ? `<button type="button" id="logout">خروج (${esc(u.fullName.split(' ')[0])})</button>` : '';
  nav.innerHTML = !u ? link('#/login', 'تسجيل الدخول') + link('#/register', 'إنشاء حساب')
    : isStaff(u) ? link('#/teacher', 'لوحة التحكم') + link('#/teacher/students', u.role === 'admin' ? 'المستخدمون' : 'الطلاب') + link('#/messages', 'الرسائل') + link('#/levels', 'معاينة') + out
    : link('#/levels', 'المستويات') + link('#/messages', 'الرسائل') + out;
  const b = document.getElementById('logout');
  if (b) b.onclick = async () => { await logout(); toast('تم تسجيل الخروج'); go('#/'); };
}

export function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

async function route() {
  const my = ++token;
  const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const u = getMe();
  renderNav();
  window.scrollTo(0, 0);
  if (!configured) return viewMessage({ app, text: 'لم تُضبط إعدادات Firebase. انسخ .env.example إلى .env واملأه.' });
  const home = () => go(isStaff(u) ? '#/teacher' : '#/levels');
  const need = (staff) => {
    if (!u) { go('#/login'); return false; }
    if (staff && !isStaff(u)) { go('#/levels'); return false; }
    return true;
  };
  const ctx = { app, go, institution };
  try {
    const [a, b, c, d] = parts;
    if (!a) return viewHome(ctx);
    if (a === 'login') return u ? home() : viewLogin({ ...ctx, banned: wasBanned() });
    if (a === 'register') return u ? home() : viewRegister(ctx);
    if (!need(a === 'teacher')) return;
    if (a === 'levels') return await viewLevels(ctx);
    if (a === 'level') return await viewLevel({ ...ctx, id: b });
    if (a === 'content') return await viewContent({ ...ctx, id: b });
    if (a === 'messages') return await viewMessages({ ...ctx, uid: b });
    if (a === 'teacher') {
      if (b === 'students') return await viewStudents(ctx);
      if (b === 'level') return await viewTeacherLevel({ ...ctx, id: c || 'new' });
      if (b === 'content') return await viewTeacherContent(c === 'new' ? { ...ctx, id: 'new', levelId: d, partId: parts[4] } : { ...ctx, id: c });
      return await viewTeacher(ctx);
    }
    viewHome(ctx);
  } catch (e) { if (my === token) showError(app, e); }
}

window.addEventListener('hashchange', route);
(async () => {
  app.innerHTML = '<p class="empty">جارٍ التحميل…</p>';
  if (configured) {
    await initAuth().catch(() => null);
    institution = await getInstitution().catch(() => null);
    onMe(() => { renderNav(); });
    initAnalytics();
  }
  route();
})();
