import { getPosts, summary } from '../lib/posts';
export const prerender = true;
export async function GET() {
  const posts = await getPosts();
  return new Response(JSON.stringify(posts.map(entry => ({ ...summary(entry), body: entry.body || '' }))), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
