import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPagination } from '../utils/apiResponse';
import * as propertyService from '../services/property.service';
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  ListPropertiesInput,
} from '../validators/property.validator';

/** GET /api/properties — public, paginated, filtered search. */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as ListPropertiesInput;
  const { items, total } = await propertyService.listProperties({
    q: q.q,
    city: q.city,
    propertyType: q.propertyType,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    guests: q.guests,
    amenities: q.amenities,
    sort: q.sort,
    page: q.page,
    limit: q.limit,
  });
  return sendSuccess(res, items, 200, { pagination: buildPagination(q.page, q.limit, total) });
});

/** GET /api/properties/:id — public detail (owner/admin may also see their inactive listings). */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const viewer = req.user ? { id: req.user.id, role: req.user.role } : undefined;
  const property = await propertyService.getPropertyById(String(req.params.id), viewer);
  return sendSuccess(res, { property });
});

/** POST /api/properties — owner/admin only; owner is the authenticated user. */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.createProperty(req.user!.id, req.body as CreatePropertyInput);
  return sendSuccess(res, { property }, 201);
});

/** PATCH /api/properties/:id — owner-of-it or admin (ownership enforced in the service). */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const actor = { id: req.user!.id, role: req.user!.role };
  const property = await propertyService.updateProperty(String(req.params.id), actor, req.body as UpdatePropertyInput);
  return sendSuccess(res, { property });
});

/** DELETE /api/properties/:id — owner-of-it or admin. */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const actor = { id: req.user!.id, role: req.user!.role };
  await propertyService.deleteProperty(String(req.params.id), actor);
  return sendSuccess(res, { deleted: true });
});
