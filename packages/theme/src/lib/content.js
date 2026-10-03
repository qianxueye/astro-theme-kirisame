/** Join a site-relative path to an optional deployment subdirectory. */
export function withBase(base, path = '/') {
  if (/^https?:\/\//u.test(path)) return path;
  const prefix = '/' + String(base || '/').split('/').filter(Boolean).join('/');
  return (prefix === '/' ? '' : prefix) + '/' + String(path).replace(/^\/+/, '');
}
export function postPath(id, base = '/') {
  const segments = String(id).split('/');
  if (segments.some(s => !s || s === '.' || s === '..' || /[?#\\]/u.test(s))) throw new TypeError('Invalid post ID');
  return withBase(base, '/posts/' + segments.map(encodeURIComponent).join('/') + '/');
}
export function topicPath(topic, base = '/') { return withBase(base, '/topics/' + encodeURIComponent(topic) + '/'); }
export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('Invalid publication date');
  return date.toISOString().slice(0, 10).replaceAll('-', '.');
}
export function readingMinutes(text = '') {
  const cjk = (text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) || []).length;
  const words = (text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
  return Math.max(1, Math.ceil(cjk / 350 + words / 220));
}
export function isPublished(data, now = new Date()) {
  const date = new Date(data.published);
  return data.draft === false && Number.isFinite(date.getTime()) && date <= now;
}
export function escapeXML(value) {
  return String(value).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
}
