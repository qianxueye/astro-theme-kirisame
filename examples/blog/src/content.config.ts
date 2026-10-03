import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema } from '@qianxueye/astro-theme-kirisame/schema';
export const collections = { posts: defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: postSchema,
}) };
