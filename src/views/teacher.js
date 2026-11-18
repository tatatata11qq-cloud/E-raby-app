import { KINDS, KIND_ICON } from '../config.js';
import { esc, pct, avg, safeUrl, driveInfo } from '../lib/util.js';
import { getMe, isAdmin } from '../lib/auth.js';
import * as S from '../lib/store.js';
import { guard, toast } from '../lib/ui.js';

const fmt = (t) => (t ? new Date(t).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');
const num = (v) => Number(v) || 0;

/* ---------- لوحة التحكم ---------- */
export async function viewTeacher({ app, go, institution }) {
  const u = getMe();
  const [levels, contents, users, results] = await Promise.all([S.getLevels(), S.getAllContents(), S.getUsers(), S.getAllResults()]);
  app.innerHTML = `
    <div class="row"><h2>لوحة التحكم</h2><a class="btn gold" href="#/teacher/level/new">+ مستوى جديد</a></div>
    <div class="stats">
      <div class="stat"><b>${levels.length}</b>مستويات</div>
      <div class="stat"><b>${contents.length}</b>عناصر محتوى</div>
      <div class="stat"><b>${users.filter((x) => x.role === 'student').length}</b>طلاب</div>
      <div class="stat"><b>${results.length}</b>محاولات اختبار</div>
    </div>
    ${levels.length ? `<div class="table-wrap"><table><thead><tr><th>المستوى</th><th>الترتيب</th><th>المحتوى</th><th>إجراءات</th></tr></thead><tbody>
      ${levels.map((l) => `<tr><td>${esc(l.title)}</td><td>${num(l.order)}</td><td>${contents.filter((c) => c.levelId === l.id).length}</td>
        <td><a class="btn small ghost" href="#/teacher/level/${esc(l.id)}">إدارة</a>
        <button class="btn small danger" type="button" data-del="${esc(l.id)}">حذف</button></td></tr>`).join('')}
    </tbody></table></div>` : '<p class="empty">لم تضف أي مستوى بعد.</p>'}
    ${isAdmin(u) ? `<form id="inst" class="card" style="margin-top:1rem" novalidate>
      <h3>المؤسسة التعليمية (تظهر في الصفحة الرئيسية)</h3>
      <label for="iname">اسم المؤسسة</label><input id="iname" type="text" value="${esc((institution || {}).name || '')}">
      <label for="iurl">رابط الموقع</label><input id="iurl" type="text" dir="ltr" value="${esc((institution || {}).url || '')}">
      <div id="ierr" class="error" hidden></div>
      <p><button class="btn small" type="submit">حفظ</button></p></form>` : ''}`;
  app.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = () => guard(b, null, async () => {
      const l = levels.find((x) => x.id === b.dataset.del);
      if (!l || !confirm(`حذف المستوى «${l.title}» مع كل جزئياته ومحتواه؟`)) return;
      await S.deleteLevel(l.id); toast('تم الحذف'); go('#/teacher');
    });
  });
  const inst = document.getElementById('inst');
  if (inst) inst.onsubmit = (e) => {
    e.preventDefault();
    guard(inst.querySelector('[type=submit]'), 'ierr', async () => {
      const url = inst.iurl.value.trim();
      if (url && !safeUrl(url)) throw new Error('الرابط غير صالح (يبدأ بـ https://).');
      await S.saveInstitution({ name: inst.iname.value.trim(), url: url ? safeUrl(url) : '' });
      toast('تم الحفظ');
    });
  };
}

/* ---------- مستوى: بياناته وجزئياته ومحتواه ---------- */
export async function viewTeacherLevel({ app, id, go }) {
  const isNew = id === 'new';
  const level = isNew ? { title: '', summary: '', order: 0 } : await S.getLevel(id);
  if (!level) { app.innerHTML = '<p class="empty">المستوى غير موجود.</p>'; return; }
  const [parts, contents] = isNew ? [[], []] : await Promise.all([S.getPartsOf(id), S.getContentsOfLevel(id)]);
  app.innerHTML = `
    <p><a href="#/teacher">← لوحة التحكم</a></p>
    <h2>${isNew ? 'مستوى جديد' : 'إدارة المستوى'}</h2>
    <form id="f" class="card" novalidate>
      <label for="title">اسم المستوى</label><input id="title" type="text" value="${esc(level.title)}">
      <label for="summary">وصف قصير</label><input id="summary" type="text" value="${esc(level.summary || '')}">
      <label for="order">الترتيب (رقم)</label><input id="order" type="text" inputmode="numeric" dir="ltr" value="${num(level.order)}">
      <div id="err" class="error" hidden></div>
      <p><button class="btn" type="submit">حفظ المستوى</button></p>
    </form>
    ${isNew ? '' : `<h3>الجزئيات والمحتوى</h3>
    ${parts.map((p) => `<section class="card" style="margin:.8rem 0">
      <div class="row"><h3>${esc(p.title)}</h3><span>
        <a class="btn small gold" href="#/teacher/content/new/${esc(id)}/${esc(p.id)}">+ محتوى</a>
        <button class="btn small danger" type="button" data-delpart="${esc(p.id)}">حذف الجزئية</button></span></div>
      <ul class="items">${contents.filter((c) => c.partId === p.id).map((c) => `<li>${KIND_ICON[c.kind] || '•'} ${esc(c.title)}
        <span class="badge gold">${esc(KINDS[c.kind] || '')}</span>
        <a class="btn small ghost" href="#/teacher/content/${esc(c.id)}">تعديل</a>
        <button class="btn small danger" type="button" data-delc="${esc(c.id)}">حذف</button></li>`).join('') || '<li class="hint">لا محتوى بعد.</li>'}</ul>
    </section>`).join('')}
    <form id="pf" class="card" novalidate>
      <label for="ptitle">جزئية جديدة</label><input id="ptitle" type="text" placeholder="مثال: الجزئية الأولى — المرفوعات">
      <div id="perr" class="error" hidden></div>
      <p><button class="btn small" type="submit">+ إضافة جزئية</button></p>
    </form>`}`;
  const f = document.getElementById('f');
  f.onsubmit = (e) => {
    e.preventDefault();
    guard(f.querySelector('[type=submit]'), 'err', async () => {
      const title = f.title.value.trim();
      if (!title) throw new Error('أدخل اسم المستوى.');
      const nid = await S.saveLevel(isNew ? null : id, { title, summary: f.summary.value.trim(), order: num(f.order.value) });
      toast('تم الحفظ'); go(`#/teacher/level/${nid}`);
    });
  };
  const pf = document.getElementById('pf');
  if (pf) pf.onsubmit = (e) => {
    e.preventDefault();
    guard(pf.querySelector('[type=submit]'), 'perr', async () => {
      const title = pf.ptitle.value.trim();
      if (!title) throw new Error('أدخل اسم الجزئية.');
      await S.savePart(null, { levelId: id, title, order: parts.length + 1 });
      go(`#/teacher/level/${id}`);
    });
  };
  app.querySelectorAll('[data-delpart]').forEach((b) => { b.onclick = () => guard(b, null, async () => {
    if (!confirm('حذف الجزئية مع كل محتواها؟')) return;
    await S.deletePart(b.dataset.delpart); go(`#/teacher/level/${id}`);
  }); });
  app.querySelectorAll('[data-delc]').forEach((b) => { b.onclick = () => guard(b, null, async () => {
    if (!confirm('حذف هذا المحتوى؟')) return;
    await S.deleteContent(b.dataset.delc); go(`#/teacher/level/${id}`);
  }); });
}

/* ---------- محرر المحتوى ---------- */
const qBox = (i, q) => {
  q = q || { q: '', options: ['', '', '', ''], answer: 0 };
  return `<div class="qbox" data-qbox><div class="row"><strong>سؤال</strong><button type="button" class="btn small danger" data-rmq>حذف السؤال</button></div>
    <label>نص السؤال</label><input type="text" class="q-text" value="${esc(q.q)}">
    ${q.options.map((o, j) => `<div class="qopt"><input type="radio" name="ans${i}" value="${j}" ${q.answer === j ? 'checked' : ''} aria-label="الإجابة الصحيحة">
      <input type="text" class="q-opt" value="${esc(o)}" placeholder="الخيار ${j + 1}"></div>`).join('')}
    <p class="hint">حدّد الدائرة بجانب الإجابة الصحيحة.</p></div>`;
};

export async function viewTeacherContent({ app, id, levelId, partId, go }) {
  const isNew = id === 'new';
  const c = isNew ? { title: '', kind: 'lesson', driveUrl: '', body: '', questions: [], levelId, partId } : await S.getContent(id);
  if (!c || !c.levelId) { app.innerHTML = '<p class="empty">المحتوى غير موجود.</p>'; return; }
  let n = 0;
  app.innerHTML = `
    <p><a href="#/teacher/level/${esc(c.levelId)}">← العودة للمستوى</a></p>
    <h2>${isNew ? 'محتوى جديد' : 'تعديل المحتوى'}</h2>
    <form id="f" class="card" novalidate>
      <label for="title">العنوان</label><input id="title" type="text" value="${esc(c.title)}">
      <label for="kind">النوع</label>
      <select id="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${k === c.kind ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <label for="drive">رابط Google Drive (اختياري)</label><input id="drive" type="text" dir="ltr" value="${esc(c.driveUrl || '')}" placeholder="https://drive.google.com/file/d/...">
      <p class="hint">يجب أن تكون مشاركة الملف «أي شخص لديه الرابط يمكنه العرض».</p>
      <label for="body">النص (اختياري)</label><textarea id="body">${esc(c.body || '')}</textarea>
      <p class="hint">كل سطر فقرة. الأسطر التي تبدأ بـ «مثال:» أو «الإعراب:» تظهر مميّزة.</p>
      <div id="quizBox"><h3>أسئلة الاختبار</h3><div id="qs">${(c.questions || []).map((q) => qBox(n++, q)).join('')}</div>
        <p><button type="button" class="btn ghost small" id="addq">+ إضافة سؤال</button></p></div>
      <div id="err" class="error" hidden></div>
      <p><button class="btn" type="submit">حفظ</button></p>
    </form>`;
  const f = document.getElementById('f');
  const qs = document.getElementById('qs');
  const sync = () => { document.getElementById('quizBox').hidden = f.kind.value !== 'quiz'; };
  f.kind.onchange = sync; sync();
  document.getElementById('addq').onclick = () => qs.insertAdjacentHTML('beforeend', qBox(n++));
  qs.addEventListener('click', (e) => { const b = e.target.closest('[data-rmq]'); if (b) b.closest('[data-qbox]').remove(); });
  f.onsubmit = (e) => {
    e.preventDefault();
    guard(f.querySelector('[type=submit]'), 'err', async () => {
      const title = f.title.value.trim();
      if (!title) throw new Error('أدخل العنوان.');
      const drive = f.drive.value.trim();
      if (drive && !driveInfo(drive).ok) throw new Error('رابط Google Drive غير صالح.');
      const questions = [];
      if (f.kind.value === 'quiz') {
        for (const box of qs.querySelectorAll('[data-qbox]')) {
          const q = box.querySelector('.q-text').value.trim();
          const options = [...box.querySelectorAll('.q-opt')].map((x) => x.value.trim());
          const ck = box.querySelector('input[type=radio]:checked');
          if (!q || options.some((o) => !o)) throw new Error('أكمل نص كل سؤال وخياراته الأربعة.');
          if (!ck) throw new Error('حدّد الإجابة الصحيحة لكل سؤال.');
          questions.push({ q, options, answer: Number(ck.value) });
        }
        if (!questions.length) throw new Error('أضف سؤالًا واحدًا على الأقل.');
      }
      await S.saveContent(isNew ? null : id, {
        levelId: c.levelId, partId: c.partId, title, kind: f.kind.value,
        driveUrl: drive ? safeUrl(drive) : '', body: f.body.value, questions,
        order: c.order || 0
      });
      toast('تم الحفظ'); go(`#/teacher/level/${c.levelId}`);
    });
  };
}

/* ---------- الطلاب (والإدارة للمدير) ---------- */
export async function viewStudents({ app, go }) {
  const me = getMe();
  const [users, results] = await Promise.all([S.getUsers(), S.getAllResults()]);
  const list = users.filter((x) => (isAdmin(me) ? x.uid !== me.uid && x.id !== me.uid : x.role === 'student'))
    .sort((a, b) => String(a.fullName).localeCompare(String(b.fullName), 'ar'));
  app.innerHTML = `
    <p><a href="#/teacher">← لوحة التحكم</a></p><h2>${isAdmin(me) ? 'المستخدمون' : 'الطلاب'}</h2>
    ${list.length ? `<div class="table-wrap"><table><thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>المحاولات</th><th>المتوسط</th><th>آخر نشاط</th>${isAdmin(me) ? '<th>إدارة</th>' : ''}</tr></thead><tbody>
    ${list.map((s) => {
      const mine = results.filter((r) => r.uid === s.id);
      const ROLE = { student: 'طالب', teacher: 'مدرس', admin: 'مدير' };
      return `<tr><td>${esc(s.fullName)}${s.banned ? ' <span class="badge">محظور</span>' : ''}</td><td dir="ltr">${esc(s.email)}</td><td>${ROLE[s.role] || ''}</td>
        <td>${mine.length}</td><td>${mine.length ? avg(mine.map((r) => pct(r.score, r.total))) + '%' : '—'}</td>
        <td>${fmt(Math.max(0, ...mine.map((r) => r.at || 0)))}</td>
        ${isAdmin(me) ? `<td>${s.role === 'student' ? `<button class="btn small ghost" data-role="teacher" data-u="${esc(s.id)}">ترقية لمدرس</button>` : s.role === 'teacher' ? `<button class="btn small ghost" data-role="student" data-u="${esc(s.id)}">إرجاع لطالب</button>` : ''}
          <button class="btn small ${s.banned ? '' : 'danger'}" data-ban="${s.banned ? '0' : '1'}" data-u="${esc(s.id)}">${s.banned ? 'رفع الحظر' : 'حظر'}</button>
          <a class="btn small ghost" href="#/messages/${esc(s.id)}">رسائل</a></td>` : ''}</tr>`;
    }).join('')}</tbody></table></div>` : '<p class="empty">لا يوجد مستخدمون بعد.</p>'}`;
  app.querySelectorAll('[data-role]').forEach((b) => { b.onclick = () => guard(b, null, async () => {
    await S.setUserFields(b.dataset.u, { role: b.dataset.role }); toast('تم التحديث'); go('#/teacher/students');
  }); });
  app.querySelectorAll('[data-ban]').forEach((b) => { b.onclick = () => guard(b, null, async () => {
    await S.setUserFields(b.dataset.u, { banned: b.dataset.ban === '1' }); toast('تم التحديث'); go('#/teacher/students');
  }); });
}
