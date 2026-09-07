import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPagination } from '../utils/apiResponse';
import { AppError } from '../utils/errors';
import * as wishlistService from '../services/wishlist.service';
import type { AddWishlistInput, ListWishlistQuery, WishlistIdParams } from '../validators/wishlist.validator';

export const list = asyncHandler(async (req, res) => {
  const customerId = req.user?.id;
  if (!customerId) throw AppError.unauthorized();

  const { page, limit } = req.query as unknown as ListWishlistQuery;
  const { items, total } = await wishlistService.getWishlist(customerId, page, limit);
  return sendSuccess(res, items, 200, { pagination: buildPagination(page, limit, total) });
});

export const listIds = asyncHandler(async (req, res) => {
  const customerId = req.user?.id;
  if (!customerId) throw AppError.unauthorized();

  const ids = await wishlistService.getWishlistIds(customerId);
  return sendSuccess(res, { ids }, 200);
});

export const add = asyncHandler(async (req, res) => {
  const customerId = req.user?.id;
  if (!customerId) throw AppError.unauthorized();

  const { propertyId } = req.body as AddWishlistInput;
  const entry = await wishlistService.addToWishlist(customerId, propertyId);
  return sendSuccess(res, entry, 201);
});

export const remove = asyncHandler(async (req, res) => {
  const customerId = req.user?.id;
  if (!customerId) throw AppError.unauthorized();

  const { propertyId } = req.params as unknown as WishlistIdParams;
  const result = await wishlistService.removeFromWishlist(customerId, propertyId);
  return sendSuccess(res, result, 200);
});
