import { config } from '../site.config';
export const prerender = true;
export function GET() {
  return new Response(config.indexable ? `User-agent: *\nAllow: /\nSitemap: ${config.url}${config.base}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
