import type { Response } from 'express';

/** Standard success/error response envelope used by every endpoint. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: { pagination?: PaginationMeta },
): Response {
  return res.status(statusCode).json({ success: true, data, ...(meta ?? {}) });
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}


export function apiResponse<T>(
  data: T,
  pagination?: { page: number; limit: number; total: number },
): { success: true; data: T; pagination?: PaginationMeta } {
  return {
    success: true,
    data,
    ...(pagination ? { pagination: buildPagination(pagination.page, pagination.limit, pagination.total) } : {}),
  };
}