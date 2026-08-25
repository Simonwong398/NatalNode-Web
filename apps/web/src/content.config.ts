import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LEARN_CATEGORY_KEYS } from './lib/content-taxonomy';

const learn = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/learn',
    deferRender: true
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    slug: z.string().min(1),
    category: z.enum(LEARN_CATEGORY_KEYS),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    summary: z.string().optional()
  })
});

export const collections = { learn };
