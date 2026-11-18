let timer;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), 2600);
}

/** يشغّل fn مع تعطيل الزر وعرض الخطأ في عنصر errId (أو toast) */
export async function guard(btn, errId, fn, fmt = (e) => e.message) {
  const box = errId ? document.getElementById(errId) : null;
  if (box) box.hidden = true;
  if (btn) btn.disabled = true;
  try { await fn(); }
  catch (e) {
    const m = fmt(e) || 'حدث خطأ غير متوقع.';
    if (box) { box.textContent = m; box.hidden = false; } else toast(m);
  } finally { if (btn) btn.disabled = false; }
}

export function showError(app, e) {
  console.error(e);
  const denied = e && e.code === 'permission-denied';
  app.innerHTML = `<p class="empty">${denied ? 'ليست لديك صلاحية لهذه الصفحة.' : 'تعذّر تحميل البيانات. تحقق من اتصالك ثم أعد المحاولة.'}</p>`;
}
