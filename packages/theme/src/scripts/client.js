import { createMotion } from './motion.js';

// Native document navigation, no router interception and no external services.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = document.documentElement;
const STORE = 'kirisame-reading-v1';
const Motion = createMotion();
const currentPage = $('[data-page]');
const base = document.body.dataset.base || '/';
const defaults = {
  theme: root.dataset.appearance || 'auto',
  size: Number(root.dataset.sizeDefault) || 19,
  font: root.dataset.fontDefault || 'sans',
  motion: root.dataset.motionDefault || 'auto',
};
let saved = {};
try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { /* Storage is optional. */ }
const preferences = {
  theme: ['auto', 'light', 'dark'].includes(saved.theme) ? saved.theme : defaults.theme,
  size: [17, 19, 21].includes(saved.size) ? saved.size : defaults.size,
  font: ['sans', 'serif'].includes(saved.font) ? saved.font : defaults.font,
  motion: saved.motion === 'off' || saved.motion === 'auto' ? saved.motion : defaults.motion,
};
const darkSystem = matchMedia('(prefers-color-scheme: dark)');
let toastTimer;
let scrollPending = false;
let menuGeneration = 0;
const dialogGenerations = new WeakMap();
const tocGenerations = new WeakMap();
const behavior = () => Motion.reduced() ? 'instant' : 'smooth';

function toast(message) {
  const element = $('#toast');
  if (!element) return;
  clearTimeout(toastTimer);
  element.textContent = message;
  element.classList.add('visible');
  toastTimer = setTimeout(() => element.classList.remove('visible'), 2200);
}
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify(preferences)); } catch { /* Preferences work in memory. */ }
}
function updateMotionControls() {
  $$('#motion-options [data-motion-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.motionMode === preferences.motion)));
  const hint = $('#motion-hint');
  if (hint) hint.textContent = Motion.system.matches ? '系统已开启减少动态效果，本站动效已关闭。' : preferences.motion === 'off' ? '动效已关闭，所有内容与操作照常可用。' : '短暂过渡，不循环播放；遵循系统的减少动态效果设置。';
  const replay = $('#replay-motion');
  if (replay) replay.disabled = Motion.reduced();
}
function applyPreferences() {
  root.dataset.theme = preferences.theme === 'auto' ? (darkSystem.matches ? 'dark' : 'light') : preferences.theme;
  root.dataset.readerFont = preferences.font;
  root.style.setProperty('--reader-size', `${preferences.size}px`);
  $('.theme-toggle')?.setAttribute('aria-label', `切换为${root.dataset.theme === 'light' ? '深' : '浅'}色模式`);
  const mobile = matchMedia('(max-width:640px)').matches;
  $$('#font-size-options [data-size]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.size) === preferences.size));
    const number = $('span', button);
    if (number) number.textContent = String(mobile ? Math.max(17, Number(button.dataset.size) - 1) : button.dataset.size);
  });
  $$('#font-family-options [data-font]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.font === preferences.font)));
  Motion.setPreference(preferences.motion);
  updateMotionControls();
  requestScrollUpdate();
}
window.addEventListener('kirisame:motion-change', updateMotionControls);
darkSystem.addEventListener('change', () => { if (preferences.theme === 'auto') applyPreferences(); });

function closeDialog(dialog, immediate = false) {
  if (!dialog?.open) return;
  const generation = (dialogGenerations.get(dialog) || 0) + 1;
  dialogGenerations.set(dialog, generation);
  const finish = () => {
    if (dialogGenerations.get(dialog) !== generation) return;
    dialog.classList.remove('closing');
    dialog.close();
  };
  if (immediate || Motion.reduced()) { Motion.stop(dialog); finish(); return; }
  dialog.classList.add('closing');
  const animation = Motion.play(dialog, [
    { opacity: 1, transform: 'translateY(0) scale(1)' },
    { opacity: 0, transform: 'translateY(6px) scale(.99)' },
  ], { duration: 150, easing: 'ease-in' });
  if (animation) animation.finished.then(finish, finish); else finish();
}
function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!(dialog instanceof HTMLDialogElement)) return;
  $$('dialog[open]').forEach(element => closeDialog(element, true));
  dialogGenerations.set(dialog, (dialogGenerations.get(dialog) || 0) + 1);
  dialog.classList.remove('closing');
  dialog.showModal();
  document.body.classList.add('modal-open');
  if (id === 'search-dialog') {
    $('#search-input').value = '';
    search('');
    $('#search-input').focus();
  }
  Motion.play(dialog, [
    { opacity: 0, transform: 'translateY(12px) scale(.985)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' },
  ], { duration: 260 });
}
$$('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('modal-open'); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  });
});
$$('[data-open]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.open)));
$$('.close-dialog').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));

function setMenu(open, animate = true) {
  const menu = $('#mobile-menu');
  const toggle = $('.menu-toggle');
  if (!menu || !toggle) return;
  const generation = ++menuGeneration;
  const before = menu.hidden ? 0 : menu.getBoundingClientRect().height;
  Motion.stop(menu);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '收起导航' : '展开导航');
  if (!animate || Motion.reduced()) { menu.hidden = !open; return; }
  menu.hidden = false;
  const after = open ? menu.getBoundingClientRect().height : 0;
  const animation = Motion.play(menu, [{ height: `${before}px`, opacity: open ? 0 : 1 }, { height: `${after}px`, opacity: open ? 1 : 0 }], { duration: 220 });
  const finish = () => { if (generation === menuGeneration) menu.hidden = !open; };
  if (animation) animation.finished.then(finish, finish); else finish();
}
function setToc(details, open) {
  const generation = (tocGenerations.get(details) || 0) + 1;
  tocGenerations.set(details, generation);
  const before = details.getBoundingClientRect().height;
  Motion.stop(details);
  if (Motion.reduced()) { details.open = open; return; }
  details.open = true;
  const after = open ? details.getBoundingClientRect().height : $('summary', details).getBoundingClientRect().height + 2;
  details.classList.add('toc-animating');
  const animation = Motion.play(details, [{ height: `${before}px` }, { height: `${after}px` }], { duration: 230 });
  const finish = () => { if (tocGenerations.get(details) === generation) { details.open = open; details.classList.remove('toc-animating'); } };
  if (animation) animation.finished.then(finish, finish); else finish();
}
$$('.mobile-toc summary').forEach(summary => summary.addEventListener('click', event => {
  event.preventDefault();
  const details = summary.parentElement;
  setToc(details, !details.open);
}));
$('.menu-toggle')?.addEventListener('click', () => setMenu($('.menu-toggle').getAttribute('aria-expanded') !== 'true'));
function focusMode(enabled) {
  document.body.classList.toggle('focus-mode', enabled);
  $$('.focus-toggle').forEach(button => button.setAttribute('aria-pressed', String(enabled)));
  Motion.reveal($('.article-wrap'), 0, 5, 280);
  if (enabled) $('.exit-focus')?.focus({ preventScroll: true });
  else $('.focus-toggle')?.focus({ preventScroll: true });
  requestScrollUpdate();
}
$$('.focus-toggle').forEach(button => button.addEventListener('click', () => focusMode(!document.body.classList.contains('focus-mode'))));
$('.exit-focus')?.addEventListener('click', () => focusMode(false));
$$('.back-top').forEach(button => button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: behavior() })));
$('.theme-toggle')?.addEventListener('click', () => Motion.themeChange(() => {
  preferences.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  applyPreferences(); persist();
}));
$$('#font-size-options [data-size]').forEach(button => button.addEventListener('click', () => { preferences.size = Number(button.dataset.size); applyPreferences(); persist(); }));
$$('#font-family-options [data-font]').forEach(button => button.addEventListener('click', () => { preferences.font = button.dataset.font; applyPreferences(); persist(); }));
$$('#motion-options [data-motion-mode]').forEach(button => button.addEventListener('click', () => { preferences.motion = button.dataset.motionMode; Motion.setPreference(preferences.motion); persist(); }));
$('#replay-motion')?.addEventListener('click', () => {
  $$('dialog[open]').forEach(dialog => closeDialog(dialog, true));
  window.scrollTo({ top: 0, behavior: 'instant' });
  Motion.entrance(currentPage, true);
});
$('#reset-settings')?.addEventListener('click', () => {
  Object.assign(preferences, defaults);
  try { localStorage.removeItem(STORE); } catch {}
  applyPreferences(); toast('阅读偏好已清除');
});
$$('.filter').forEach(button => button.addEventListener('click', () => {
  if (button.classList.contains('active')) return;
  const list = $('#home-posts');
  if (!list) return;
  Motion.filterList(list, () => {
    $$('.filter').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    $$('.post-row', list).forEach(row => { row.hidden = button.dataset.filter !== 'all' && row.dataset.topic !== button.dataset.filter; });
    if ($('#filter-empty')) $('#filter-empty').hidden = !!$('.post-row:not([hidden])', list);
  });
}));

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
$('.copy-link')?.addEventListener('click', async () => toast(await copy(location.href) ? '文章链接已复制' : '浏览器未允许复制，请从地址栏复制链接'));
$$('.markdown pre').forEach(pre => {
  pre.tabIndex = 0;
  pre.setAttribute('aria-label', '代码，可横向滚动');
  const button = document.createElement('button');
  button.className = 'code-copy js-only'; button.type = 'button'; button.textContent = '复制代码';
  button.addEventListener('click', async () => {
    const ok = await copy($('code', pre)?.textContent || pre.textContent || '');
    button.textContent = ok ? '已复制' : '请手动选择代码';
    setTimeout(() => { button.textContent = '复制代码'; }, 1800);
  });
  pre.after(button);
});
$$('.markdown table').forEach(table => { table.tabIndex = 0; table.setAttribute('aria-label', '表格，可横向滚动'); });
$$('[data-anchor]').forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(link.dataset.anchor);
  if (!target) return;
  event.preventDefault();
  const details = link.closest('details');
  if (details) { Motion.stop(details); tocGenerations.set(details, (tocGenerations.get(details) || 0) + 1); details.classList.remove('toc-animating'); details.open = false; }
  target.scrollIntoView({ behavior: behavior(), block: 'start' });
  history.replaceState(null, '', '#' + encodeURIComponent(target.id));
  target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
}));
function updateScroll() {
  scrollPending = false;
  const article = $('.markdown');
  if (!article) return;
  const rect = article.getBoundingClientRect();
  const span = $('.reading-progress span');
  const fraction = Math.max(0, Math.min(1, (innerHeight * .2 - rect.top) / Math.max(1, rect.height - innerHeight * .6)));
  if (span) span.style.transform = `scaleX(${fraction})`;
  const headings = $$('h2[id],h3[id]', article);
  let active = headings[0]?.id;
  for (const heading of headings) if (heading.getBoundingClientRect().top < innerHeight * .3) active = heading.id;
  $$('.toc a[data-anchor]').forEach(link => { const selected = link.dataset.anchor === active; link.classList.toggle('active', selected); if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
}
function requestScrollUpdate() { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }
window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', () => {
  applyPreferences(); Motion.indicators(false);
  if (!matchMedia('(max-width:640px)').matches) setMenu(false, false);
}, { passive: true });

let searchGeneration = 0;
let fallbackPromise;
let enginePromise;
async function fallbackIndex() {
  if (!fallbackPromise) fallbackPromise = fetch(base + 'search.json').then(response => {
    if (!response.ok) throw new Error('Search index unavailable');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data)) throw new Error('Invalid search index');
    return data;
  }).catch(error => { fallbackPromise = null; throw error; });
  return fallbackPromise;
}
async function engine() {
  if (document.body.dataset.searchPagefind === 'false') return null;
  if (!enginePromise) enginePromise = import(/* @vite-ignore */ base + 'pagefind/pagefind.js')
    .then(async pagefind => { await pagefind.options({ baseUrl: base }); return pagefind; })
    .catch(() => null);
  return enginePromise;
}
function safeLink(path) {
  try {
    const url = new URL(path, location.origin);
    return url.origin === location.origin && url.pathname.startsWith(base) ? url.href : null;
  } catch { return null; }
}
function textResult(post) {
  const href = safeLink(post.href);
  if (!href) return null;
  const link = document.createElement('a'); link.className = 'search-result'; link.href = href;
  const topic = document.createElement('span'); topic.textContent = post.topic || '';
  const title = document.createElement('strong'); title.textContent = post.title || '';
  const excerpt = document.createElement('p'); excerpt.textContent = post.description || '';
  link.append(topic, title, excerpt); return link;
}
async function search(value) {
  const query = value.trim().slice(0, 160);
  const generation = ++searchGeneration;
  const results = $('#search-results'); const count = $('#search-count');
  if (!results || !count) return;
  results.replaceChildren();
  if (!query) { count.textContent = '输入关键词搜索'; return; }
  count.textContent = '正在搜索…';
  try {
    let matches;
    const pagefind = await engine();
    if (pagefind) {
      const response = await pagefind.search(query);
      matches = await Promise.all(response.results.slice(0, 20).map(async result => {
        const item = await result.data();
        // Excerpts contain markup; strip it instead of inserting HTML.
        const excerpt = new DOMParser().parseFromString(item.excerpt || '', 'text/html').body.textContent || '';
        return { href: item.url, title: item.meta?.title || '', description: excerpt, topic: '' };
      }));
    } else {
      const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
      matches = (await fallbackIndex()).filter(item => {
        const text = [item.title, item.description, item.topic, item.body].join(' ').toLocaleLowerCase();
        return terms.every(term => text.includes(term));
      }).slice(0, 20);
    }
    if (generation !== searchGeneration) return;
    for (const match of matches) { const node = textResult(match); if (node) results.append(node); }
    count.textContent = results.children.length ? `找到 ${results.children.length} 条结果` : '没有找到匹配的文章';
  } catch {
    if (generation === searchGeneration) count.textContent = '搜索暂时不可用，请使用归档浏览文章。';
  }
}
let inputTimer;
$('#search-input')?.addEventListener('input', event => {
  clearTimeout(inputTimer);
  // Invalidate in-flight results as soon as the user edits the query.
  searchGeneration++;
  inputTimer = setTimeout(() => search(event.target.value), 120);
});
$('#search-input')?.addEventListener('keydown', event => { if (event.key === 'Enter') { const first = $('.search-result'); if (first) { event.preventDefault(); first.click(); } } });
document.addEventListener('keydown', event => {
  const typing = event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"]');
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && $('#search-dialog')) { event.preventDefault(); openDialog('search-dialog'); }
  else if (event.key === '/' && !typing && !$('dialog[open]') && $('#search-dialog')) { event.preventDefault(); openDialog('search-dialog'); }
  else if (event.key === 'Escape') {
    if ($('dialog[open]')) { event.preventDefault(); $$('dialog[open]').forEach(dialog => closeDialog(dialog)); }
    else if (document.body.classList.contains('focus-mode')) focusMode(false);
    else setMenu(false);
  }
});
if (!/Mac|iPhone|iPad/.test(navigator.platform) && $('.search-trigger kbd')) $('.search-trigger kbd').textContent = 'Ctrl K';
applyPreferences();
Motion.indicators(false);
Motion.entrance(currentPage, true, Boolean(location.hash));
window.addEventListener('pageshow', event => { if (event.persisted) { Motion.stopAll(); requestScrollUpdate(); } });
