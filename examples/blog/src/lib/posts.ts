import { getCollection, type CollectionEntry } from 'astro:content';
import { postPath, topicPath, readingMinutes } from '@qianxueye/astro-theme-kirisame';
import { isPublished } from '@qianxueye/astro-theme-kirisame/lib/content.js';
import type { PostSummary, Topic } from '@qianxueye/astro-theme-kirisame';
import { config } from '../site.config';
export async function getPosts() {
  return (await getCollection('posts', entry => isPublished(entry.data)))
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}
export function summary(entry: CollectionEntry<'posts'>): PostSummary {
  return { id: entry.id, ...entry.data, href: postPath(entry.id, config.base), minutes: readingMinutes(entry.body || '') };
}
export function topics(posts: CollectionEntry<'posts'>[]): Topic[] {
  return [...new Set(posts.map(post => post.data.topic))].map(name => ({
    name, href: topicPath(name, config.base), count: posts.filter(post => post.data.topic === name).length
  }));
}
