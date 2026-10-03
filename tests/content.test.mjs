import test from 'node:test';
import assert from 'node:assert/strict';
import { withBase, postPath, topicPath, formatDate, readingMinutes, isPublished, escapeXML } from '../packages/theme/src/lib/content.js';
import { defineTheme } from '../packages/theme/src/lib/config.js';
const options = { title: 'Example', author: 'Writer', url: 'https://example.com', description: 'Notes' };
test('base paths and links remain deployment independent', () => {
  assert.equal(withBase('/', '/posts/hello/'), '/posts/hello/');
  assert.equal(withBase('/notes/', '/posts/hello/'), '/notes/posts/hello/');
  assert.equal(withBase('/notes/', 'rss.xml'), '/notes/rss.xml');
  assert.equal(withBase('/notes/', 'https://example.org/'), 'https://example.org/');
});
test('post paths encode segments and reject traversal', () => {
  assert.equal(postPath('folder/hello', '/notes/'), '/notes/posts/folder/hello/');
  assert.equal(topicPath('写作'), '/topics/%E5%86%99%E4%BD%9C/');
  assert.throws(() => postPath('../private'));
  assert.throws(() => postPath('bad?query'));
});
test('dates and CJK reading estimates', () => {
  assert.equal(formatDate('2026-01-01'), '2026.01.01');
  assert.throws(() => formatDate('not a date'));
  assert.equal(readingMinutes('字'.repeat(701)), 3);
  assert.equal(readingMinutes(''), 1);
});
test('publication is explicit and future dates stay out', () => {
  const now = new Date('2026-10-02');
  assert.equal(isPublished({ published: '2026-01-01', draft: false }, now), true);
  assert.equal(isPublished({ published: '2026-01-01', draft: true }, now), false);
  assert.equal(isPublished({ published: '2026-01-01' }, now), false);
  assert.equal(isPublished({ published: '2099-01-01', draft: false }, now), false);
});
test('XML escaping', () => assert.equal(escapeXML('< & "'), '&lt; &amp; &quot;'));
test('theme defaults are generic and conservative', () => {
  const theme = defineTheme(options);
  assert.equal(theme.indexable, false); assert.equal(theme.base, '/');
  assert.equal(theme.motion, 'auto'); assert.equal(theme.reading.size, 19);
  assert.equal(theme.title, 'Example');
});
test('configuration overrides do not erase defaults', () => {
  const theme = defineTheme({ ...options, base: '/notes', reading: { font: 'serif' }, hero: { title: 'Hello' } });
  assert.equal(theme.base, '/notes/'); assert.equal(theme.reading.size, 19);
  assert.equal(theme.reading.font, 'serif'); assert.equal(theme.hero.title, 'Hello');
});
test('unsafe origins and navigation are rejected', () => {
  assert.throws(() => defineTheme({ ...options, url: 'javascript:alert(1)' }));
  assert.throws(() => defineTheme({ ...options, nav: [{ label: 'x', href: 'javascript:alert(1)' }] }));
  assert.throws(() => defineTheme({ ...options, url: 'https://example.com/blog/' }));
  assert.throws(() => defineTheme({ ...options, base: '../private' }));
});
