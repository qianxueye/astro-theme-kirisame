import { defineTheme } from '@qianxueye/astro-theme-kirisame';
export const config = defineTheme({
  title: 'Kirisame', author: '作者',
  url: import.meta.env.SITE || 'https://example.com',
  base: import.meta.env.BASE_URL,
  description: '关于文字、工具，和那些值得反复琢磨的事。',
  appearance: 'auto', motion: 'auto',
  reading: { font: 'sans', size: 19 },
  // Keep the public example unindexed; enable only for your actual publication.
  indexable: import.meta.env.PUBLIC_INDEXABLE === 'true',
});
