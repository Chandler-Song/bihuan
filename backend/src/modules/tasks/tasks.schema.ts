import { z } from 'zod';

export const CreateTaskSchema = z.object({
  input: z.string().min(1).max(500),
});

export const PatchTaskSchema = z.object({
  status: z.enum(['pending', 'done']).optional(),
  snoozeDays: z.number().int().min(0).max(365).optional(),
  content: z.string().min(1).max(500).optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  note: z.string().max(2000).optional(),
  seen: z.boolean().optional(),
  next_remind_at: z.number().int().min(0).optional(),
  tags: z.array(z.string().max(20)).optional(),
});

export const ListTaskQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: z.enum(['pending', 'done', 'all']).optional().default('all'),
  dateField: z.enum(['created', 'remind', 'closed']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  view: z.enum(['today']).optional(),
  tag: z.string().optional(),
  sortBy: z.enum(['created', 'remind', 'priority', 'tag']).optional().default('remind'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListTaskQuery = z.infer<typeof ListTaskQuerySchema>;
