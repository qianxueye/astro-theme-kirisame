import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTheme } from '../packages/theme/src/lib/config.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFile(path.join(root, name), 'utf8');
const valid = { title: 'Example', url: 'https://example.com', author: 'Author', description: 'Notes' };

test('reject invalid reader and feature configuration', () => {
  for (const bad of [{reading:{font:'unknown'}},{reading:{size:999}},{appearance:'sepia'},{motion:'always'},{indexable:'true'},{nav:[{href:'/',label:''}]}]) assert.throws(()=>defineTheme({...valid,...bad}),TypeError);
});
test('README is exactly the requested one-line description', async () => {
  assert.equal((await read('README.md')).trim(), 'Kirisame is a reading-first Astro theme with soft colors, CJK-friendly typography, and gentle motion.');
});
test('package exports the theme and excludes the consumer site', async () => {
  const pkg=JSON.parse(await read('packages/theme/package.json'));
  assert.equal(pkg.license,'MIT');
  assert.deepEqual(pkg.files,['src','README.md','LICENSE']);
  for (const name of ['.','./schema','./layouts/*','./components/*','./styles/*']) assert.ok(pkg.exports[name]);
  assert.equal(await read('LICENSE'),await read('packages/theme/LICENSE'));
});
test('theme source does not contain the personal site or prototype router', async () => {
  async function visit(folder) {
    for (const file of await fs.readdir(folder,{withFileTypes:true})) {
      const full=path.join(folder,file.name);
      if (file.isDirectory()) await visit(full);
      else {
        assert.ok(!/\.(woff2?|ttf|otf|mp4|gif|zip)$/.test(full),`Unwanted packaged asset: ${full}`);
        const text=await fs.readFile(full,'utf8');
        for (const secret of ['kirisame.moe','千雪夜','#/article/','KIRISAME_DRAFT_SENTINEL','ca-pub-']) assert.ok(!text.includes(secret),`Unexpected private/prototype string in ${full}`);
      }
    }
  }
  await visit(path.join(root,'packages/theme/src'));
});
test('all content-producing routes use the shared published-only provider', async () => {
  for (const name of ['index.astro','archive.astro','topics/index.astro','topics/[topic].astro','posts/[...slug].astro','rss.xml.ts','sitemap.xml.ts','search.json.ts']) assert.match(await read('examples/blog/src/pages/'+name),/getPosts/);
  assert.match(await read('examples/blog/src/lib/posts.ts'),/isPublished\(entry\.data\)/);
});
test('safe defaults have no external accounts or deployment workflow', async () => {
  const config=await read('examples/blog/wrangler.jsonc');
  assert.ok(!config.includes('account_id')&&!config.includes('custom_domain'));
  const ci=await read('.github/workflows/ci.yml');
  assert.match(ci,/contents: read/);assert.match(ci,/persist-credentials: false/);
  assert.ok(!ci.includes('pull_request_target')&&!ci.includes('wrangler deploy')&&!ci.includes('npm publish'));
});
