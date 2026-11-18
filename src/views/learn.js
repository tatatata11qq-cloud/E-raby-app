import { KIND_ICON, KINDS } from '../config.js';
import { esc, driveInfo, pct, avg } from '../lib/util.js';
import { getMe, isStaff } from '../lib/auth.js';
import { getLevels, getAllContents, getMyResults, getContent, getLevel, getPartsOf, getContentsOfLevel, addResult } from '../lib/store.js';
import { toast } from '../lib/ui.js';

const bestByContent = (rs) => {
  const best = {};
  rs.forEach((r) => { const p = pct(r.score, r.total); if (best[r.contentId] == null || p > best[r.contentId]) best[r.contentId] = p; });
  return best;
};

/* ---------- قائمة المستويات ---------- */
export async function viewLevels({ app }) {
  const u = getMe();
  const [levels, contents, results] = await Promise.all([getLevels(), getAllContents(), isStaff(u) ? [] : getMyResults(u.uid)]);
  const best = bestByContent(results);
  const quizzes = contents.filter((c) => c.kind === 'quiz');
  const doneAll = quizzes.filter((c) => best[c.id] != null);
  app.innerHTML = `
    <h2>أهلًا ${esc(u.fullName)}</h2>
    ${isStaff(u) ? '<p class="hint">أنت تعاين المنصة كما يراها الطالب (لا تُسجَّل نتائجك).</p>' : `
    <div class="stats">
      <div class="stat"><b>${doneAll.length}/${quizzes.length}</b>اختبارات منجزة</div>
      <div class="stat"><b>${avg(doneAll.map((c) => best[c.id]))}%</b>متوسط أفضل النتائج</div>
    </div>`}
    <h3>المستويات</h3>
    <div class="grid">
      ${levels.length ? levels.map((l) => {
        const qs = quizzes.filter((c) => c.levelId === l.id);
        const done = qs.filter((c) => best[c.id] != null).length;
        const n = contents.filter((c) => c.levelId === l.id).length;
        return `<article class="card"><h3>${esc(l.title)}</h3><p>${esc(l.summary || '')}</p>
          <p><span class="badge">${n} عنصر</span> ${qs.length && !isStaff(u) ? `<span class="badge ok">${done}/${qs.length} اختبارات</span>` : ''}</p>
          <a class="btn small" href="#/level/${esc(l.id)}">افتح المستوى</a></article>`;
      }).join('') : '<p class="empty">لا توجد مستويات بعد.</p>'}
    </div>`;
}

/* ---------- مستوى واحد: جزئياته ومحتواه ---------- */
export async function viewLevel({ app, id }) {
  const u = getMe();
  const [level, parts, contents, results] = await Promise.all([getLevel(id), getPartsOf(id), getContentsOfLevel(id), isStaff(u) ? [] : getMyResults(u.uid)]);
  if (!level) { app.innerHTML = '<p class="empty">المستوى غير موجود.</p>'; return; }
  const best = bestByContent(results);
  app.innerHTML = `
    <p><a href="#/levels">← كل المستويات</a></p>
    <h2>${esc(level.title)}</h2><p class="hint">${esc(level.summary || '')}</p>
    ${parts.length ? parts.map((p) => {
      const cs = contents.filter((c) => c.partId === p.id);
      return `<section class="card" style="margin:1rem 0"><h3>${esc(p.title)}</h3>
        ${cs.length ? `<ul class="items">${cs.map((c) => `<li><a href="#/content/${esc(c.id)}">${KIND_ICON[c.kind] || '•'} ${esc(c.title)}</a>
          <span class="badge gold">${esc(KINDS[c.kind] || '')}</span>${best[c.id] != null ? ` <span class="badge ok">${best[c.id]}%</span>` : ''}</li>`).join('')}</ul>` : '<p class="empty">لا يوجد محتوى بعد.</p>'}
      </section>`;
    }).join('') : '<p class="empty">لا توجد جزئيات في هذا المستوى بعد.</p>'}`;
}

/* ---------- عرض محتوى ---------- */
function driveBlock(url) {
  const d = driveInfo(url);
  if (!d.ok) return '';
  return `<div class="embed"><iframe src="${esc(d.embed)}" title="محتوى من Google Drive" loading="lazy" allow="autoplay; fullscreen"
      referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></div>
    <p><a class="btn small ghost" href="${esc(d.open)}" target="_blank" rel="noopener noreferrer">فتح في Google Drive ↗</a></p>`;
}

export async function viewContent({ app, id }) {
  const u = getMe();
  const c = await getContent(id);
  if (!c) { app.innerHTML = '<p class="empty">المحتوى غير موجود.</p>'; return; }
  const body = String(c.body || '').split('\n').map((x) => x.trim()).filter(Boolean)
    .map((line) => `<p class="${/^(مثال|الإعراب)\s*:/.test(line) ? 'example' : ''}">${esc(line)}</p>`).join('');
  const qs = c.kind === 'quiz' ? (c.questions || []) : [];
  app.innerHTML = `
    <p><a href="#/level/${esc(c.levelId)}">← العودة إلى المستوى</a></p>
    <article class="card lesson-body">
      <span class="badge gold">${esc(KINDS[c.kind] || '')}</span>
      <h2>${esc(c.title)}</h2>
      ${body}${driveBlock(c.driveUrl)}
      ${qs.length ? `<form id="quiz">
        ${qs.map((q, i) => `<fieldset class="question" data-i="${i}"><legend>${i + 1}. ${esc(q.q)}</legend>
          ${q.options.map((o, j) => `<label class="opt"><input type="radio" name="q${i}" value="${j}"> <span>${esc(o)}</span></label>`).join('')}</fieldset>`).join('')}
        <div id="err" class="error" hidden></div>
        <p><button class="btn" type="submit">تصحيح الإجابات</button></p></form><div id="result"></div>` : ''}
    </article>`;
  if (qs.length) wireQuiz(c, qs, u);
}

function wireQuiz(c, qs, u) {
  const form = document.getElementById('quiz');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const picks = qs.map((q, i) => { const k = form.querySelector(`input[name="q${i}"]:checked`); return k ? Number(k.value) : -1; });
    if (picks.includes(-1)) { const er = document.getElementById('err'); er.textContent = 'أجب عن جميع الأسئلة أولًا.'; er.hidden = false; return; }
    let score = 0;
    qs.forEach((q, i) => {
      form.querySelectorAll(`.question[data-i="${i}"] .opt`).forEach((o, j) => {
        o.querySelector('input').disabled = true;
        if (j === q.answer) o.classList.add('correct'); else if (j === picks[i]) o.classList.add('wrong');
      });
      if (picks[i] === q.answer) score++;
    });
    form.querySelector('[type=submit]').hidden = true;
    const p = pct(score, qs.length);
    let saved = '';
    if (!isStaff(u)) {
      try { await addResult({ uid: u.uid, contentId: c.id, levelId: c.levelId, score, total: qs.length }); }
      catch (err) { saved = '<p class="error">تعذّر حفظ النتيجة. تحقق من اتصالك.</p>'; }
    } else saved = '<p class="hint">معاينة: لا تُحفظ النتيجة.</p>';
    const msg = p === 100 ? 'ممتاز! إعراب متقن.' : p >= 60 ? 'أحسنت، راجع الأخطاء وأعد المحاولة.' : 'راجع الدرس ثم أعد المحاولة.';
    document.getElementById('result').innerHTML = `<div class="card"><h3>نتيجتك: ${score} من ${qs.length} (${p}%)</h3><p>${msg}</p>${saved}
      <div class="actions start"><a class="btn" href="#/content/${esc(c.id)}" id="again">أعد المحاولة</a><a class="btn ghost" href="#/level/${esc(c.levelId)}">العودة للمستوى</a></div></div>`;
    document.getElementById('again').onclick = (ev) => { ev.preventDefault(); window.dispatchEvent(new HashChangeEvent('hashchange')); };
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
    toast('تم التصحيح');
  };
}
