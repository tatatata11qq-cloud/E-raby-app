import { esc } from '../lib/util.js';
import { getMe, isStaff } from '../lib/auth.js';
import { getThread, getAllMessages, getUsers, sendMessage } from '../lib/store.js';
import { guard } from '../lib/ui.js';

const when = (t) => new Date(t).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });

export async function viewMessages({ app, uid, go }) {
  const u = getMe();
  if (isStaff(u) && !uid) {
    const [msgs, users] = await Promise.all([getAllMessages(), getUsers()]);
    const last = {};
    msgs.forEach((m) => { if (!last[m.threadId] || m.at > last[m.threadId].at) last[m.threadId] = m; });
    const ids = Object.keys(last).sort((a, b) => last[b].at - last[a].at);
    app.innerHTML = `<h2>رسائل الطلاب</h2>${ids.length ? `<div class="grid">${ids.map((t) => {
      const s = users.find((x) => x.id === t);
      return `<article class="card"><h3>${esc(s ? s.fullName : 'طالب')}</h3><p>${esc(last[t].text.slice(0, 80))}</p>
        <p class="hint">${when(last[t].at)}</p><a class="btn small" href="#/messages/${esc(t)}">فتح المحادثة</a></article>`;
    }).join('')}</div>` : '<p class="empty">لا توجد رسائل بعد.</p>'}`;
    return;
  }
  const tid = isStaff(u) ? uid : u.uid;
  const msgs = await getThread(tid);
  app.innerHTML = `
    ${isStaff(u) ? '<p><a href="#/messages">← كل المحادثات</a></p>' : ''}
    <h2>${isStaff(u) ? 'محادثة مع الطالب' : 'راسل مدرّسيك'}</h2>
    <div class="thread" aria-live="polite">${msgs.length ? msgs.map((m) => `
      <div class="msg ${m.fromStaff ? 'staff' : 'student'}"><b>${esc(m.fromName)}</b><p>${esc(m.text)}</p><span class="hint">${when(m.at)}</span></div>`).join('') : '<p class="empty">لا توجد رسائل بعد. ابدأ المحادثة.</p>'}</div>
    <form id="f" class="card" novalidate>
      <label for="text">رسالتك</label><textarea id="text" maxlength="2000"></textarea>
      <div id="err" class="error" hidden></div>
      <p><button class="btn" type="submit">إرسال</button></p>
    </form>`;
  const f = document.getElementById('f');
  f.onsubmit = (e) => {
    e.preventDefault();
    guard(f.querySelector('[type=submit]'), 'err', async () => {
      if (!f.text.value.trim()) throw new Error('اكتب رسالتك أولًا.');
      await sendMessage(u, tid, f.text.value);
      go(isStaff(u) ? `#/messages/${tid}` : '#/messages');
    });
  };
}
