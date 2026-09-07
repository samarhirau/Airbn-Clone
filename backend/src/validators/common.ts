import { z } from 'zod';

/** Shared Zod building blocks so every domain validates consistently. */

/** A MongoDB ObjectId (24 hex chars). */
export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

/** `:id` route param schema. */
export const idParam = z.object({ id: objectId });

/** Standard pagination query (page/limit) with sane bounds; merge into domain query schemas. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationQuery>;
