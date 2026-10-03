import { getPosts } from '../lib/posts';
import { config } from '../site.config';
import { postPath } from '@qianxueye/astro-theme-kirisame';
import { escapeXML as xml } from '@qianxueye/astro-theme-kirisame/lib/content.js';
export const prerender = true;
export async function GET() {
  const posts = await getPosts();
  const items = posts.map(post => {
    const link = new URL(postPath(post.id, config.base), config.url).href;
    return `<item><title>${xml(post.data.title)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><pubDate>${post.data.published.toUTCString()}</pubDate><description>${xml(post.data.description)}</description></item>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(config.title)}</title><link>${xml(config.url + config.base)}</link><description>${xml(config.description)}</description><language>${xml(config.lang)}</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
