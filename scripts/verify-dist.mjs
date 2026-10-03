import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root = new URL('../examples/blog/dist/', import.meta.url);
const files = [];
async function walk(path) { for (const entry of await readdir(path, { withFileTypes: true })) { const child = join(path, entry.name); if (entry.isDirectory()) await walk(child); else files.push(child); } }
await walk(root.pathname);
assert(files.some(file => file.endsWith('/posts/welcome/index.html')), 'Missing static article');
assert(files.some(file => file.endsWith('/pagefind/pagefind.js')), 'Missing Pagefind index');
for (const file of files.filter(file => /\.(html|json|xml|js|txt)$/.test(file))) {
  const text = await readFile(file, 'utf8');
  assert(!text.includes('KIRISAME_DRAFT_SENTINEL_6d73d1'), `Draft leaked: ${file}`);
  assert(!text.includes('KIRISAME_FUTURE_SENTINEL_2a831c'), `Future post leaked: ${file}`);
  if (file.endsWith('.html')) assert(!text.includes('#/article/'), `Prototype route: ${file}`);
}
const article = await readFile(new URL('posts/welcome/index.html', root), 'utf8');
assert(article.includes('从一段文字开始'), 'Article must be rendered in HTML');
assert(article.includes('rel="canonical"'), 'Canonical link missing');
assert(files.some(file => file.endsWith('/404.html')), 'Real 404 page missing');
console.log(`Verified ${files.length} built files; drafts/future posts excluded.`);
