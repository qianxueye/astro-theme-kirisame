/** @typedef {import('../types').ThemeOptions} ThemeOptions */
/** @typedef {import('../types').ThemeConfig} ThemeConfig */
/** @param {ThemeOptions} options @returns {ThemeConfig} */
export function defineTheme(options) {
  if (!options || typeof options !== 'object') throw new TypeError('Theme options are required.');
  for (const key of ['title', 'url', 'author', 'description']) {
    if (typeof options[key] !== 'string' || !options[key].trim()) throw new TypeError(`Missing theme option: ${key}`);
  }
  const url = new URL(options.url);
  if (!['https:', 'http:'].includes(url.protocol)) throw new TypeError('Site URL must be HTTP(S).');
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new TypeError('Use an origin-only site URL; configure a subdirectory through base.');
  }
  const base = '/' + (options.base || '/').split('/').filter(Boolean).join('/');
  if (base.includes('..') || /[?#\\]/u.test(base)) throw new TypeError('Invalid base path.');
  if (options.appearance != null && !['auto', 'light', 'dark'].includes(options.appearance)) throw new TypeError('Invalid appearance.');
  if (options.motion != null && !['auto', 'off'].includes(options.motion)) throw new TypeError('Invalid motion preference.');
  if (options.reading?.font != null && !['sans', 'serif'].includes(options.reading.font)) throw new TypeError('Invalid reading font.');
  if (options.reading?.size != null && ![17, 19, 21].includes(options.reading.size)) throw new TypeError('Invalid reading size.');
  for (const key of ['search', 'sidebar', 'indexable']) if (options[key] != null && typeof options[key] !== 'boolean') throw new TypeError(`Invalid flag: ${key}`);
  const nav = options.nav ?? [
    { label: '文章', href: '/' }, { label: '专题', href: '/topics/' },
    { label: '归档', href: '/archive/' }, { label: '关于', href: '/about/' }
  ];
  if (!Array.isArray(nav)) throw new TypeError('Navigation must be an array.');
  nav.forEach(({ href, label }) => {
    if (typeof href !== 'string' || typeof label !== 'string' || !label.trim()) throw new TypeError('Invalid navigation item.');
    if (!(href.startsWith('/') && !href.startsWith('//')) && !/^https?:\/\//u.test(href)) throw new TypeError('Navigation links must be local paths or HTTP(S) URLs.');
  });
  return {
    ...options, url: url.origin, base: base === '/' ? '/' : base + '/',
    lang: options.lang ?? 'zh-CN', tagline: options.tagline ?? 'notes', nav,
    hero: {
      eyebrow: '笔记 · 记录与实践', title: '慢慢写，', accent: '认真读。',
      description: options.description, note: '想清楚一些事，也留下一些线索。', ...options.hero
    },
    reading: { font: 'sans', size: 19, ...options.reading },
    appearance: options.appearance ?? 'auto', motion: options.motion ?? 'auto',
    search: options.search ?? true, sidebar: options.sidebar ?? true,
    indexable: options.indexable ?? false, footer: options.footer ?? '记录与实践'
  };
}
