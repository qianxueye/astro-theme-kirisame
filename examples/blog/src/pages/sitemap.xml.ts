import { getPosts, topics } from '../lib/posts';
import { config } from '../site.config';
import { postPath, withBase } from '@qianxueye/astro-theme-kirisame';
import { escapeXML as xml } from '@qianxueye/astro-theme-kirisame/lib/content.js';
export const prerender = true;
export async function GET() {
  const posts = await getPosts();
  const paths = ['/', '/about/', '/archive/', '/topics/'].map(path => withBase(config.base, path));
  paths.push(...posts.map(post => postPath(post.id, config.base)), ...topics(posts).map(topic => topic.href));
  const items = config.indexable ? paths.map(path => `<url><loc>${xml(new URL(path, config.url).href)}</loc></url>`).join('') : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
