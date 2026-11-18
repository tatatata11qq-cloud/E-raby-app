export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** يقبل http/https فقط ويعيد '' لأي شيء آخر (يمنع javascript: وغيره) */
export function safeUrl(u) {
  try {
    const x = new URL(String(u || '').trim());
    return /^https?:$/.test(x.protocol) ? x.href : '';
  } catch (e) { return ''; }
}

export const pct = (score, total) => (total ? Math.round((score / total) * 100) : 0);
export const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);

/** يحوّل رابط Google Drive/Docs إلى رابط تضمين (preview) ورابط فتح */
export function driveInfo(url) {
  const href = safeUrl(url);
  if (!href) return { ok: false };
  const x = new URL(href);
  if (x.hostname !== 'drive.google.com' && x.hostname !== 'docs.google.com') return { ok: false };
  const m = x.pathname.match(/\/(file|document|presentation|spreadsheets)\/d\/([\w-]+)/);
  const id = m ? m[2] : x.searchParams.get('id');
  if (!id || !/^[\w-]+$/.test(id)) return { ok: false };
  const embed = !m || m[1] === 'file'
    ? `https://drive.google.com/file/d/${id}/preview`
    : `https://docs.google.com/${m[1]}/d/${id}/preview`;
  return { ok: true, id, embed, open: href };
}
