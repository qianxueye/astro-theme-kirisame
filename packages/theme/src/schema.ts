import { z } from 'astro/zod';
export const postSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  published: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(true),
  topic: z.string().min(1).default('笔记'),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
