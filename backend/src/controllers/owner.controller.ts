import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPagination } from '../utils/apiResponse';
import type { OwnerBookingsQuery, OwnerListQuery } from '../validators/owner.validator';
import * as ownerService from '../services/owner.service';

// GET /api/owner/dashboard
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.user!.id;
  const metrics = await ownerService.getOwnerDashboard(ownerId);
  return sendSuccess(res, metrics);
});

// GET /api/owner/properties
export const listProperties = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.user!.id;
  const { page, limit } = req.query as unknown as OwnerListQuery;
  const { items, total } = await ownerService.listOwnerProperties(ownerId, page, limit);
  return sendSuccess(res, items, 200, { pagination: buildPagination(page, limit, total) });
});

// GET /api/owner/bookings
export const listBookings = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.user!.id;
  const { page, limit, status } = req.query as unknown as OwnerBookingsQuery;
  const { items, total } = await ownerService.listOwnerBookings(ownerId, { status, page, limit });
  return sendSuccess(res, items, 200, { pagination: buildPagination(page, limit, total) });
});

// GET /api/owner/properties/:id/bookings
export const listPropertyBookings = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user!;
  const { page, limit } = req.query as unknown as OwnerListQuery;
  const { items, total } = await ownerService.listPropertyBookings(
    String(req.params.id),
    actor.id,
    actor.role,
    page,
    limit,
  );
  return sendSuccess(res, items, 200, { pagination: buildPagination(page, limit, total) });
});
