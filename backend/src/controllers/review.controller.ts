import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPagination } from '../utils/apiResponse';
import type { PaginationInput } from '../validators/common';
import type { CreateReviewInput } from '../validators/review.validator';
import * as reviewService from '../services/review.service';

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user!.id;
  const { bookingId, rating, comment } = req.body as CreateReviewInput;
  const review = await reviewService.createReview(actorId, { bookingId, rating, comment });
  return sendSuccess(res, review, 201);
});

export const listPropertyReviews = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId: rawPropertyId } = req.params;
  const propertyId = Array.isArray(rawPropertyId) ? rawPropertyId[0] : rawPropertyId;
  const { page, limit } = req.query as unknown as PaginationInput;
  const { items, total, ratingAvg, ratingCount } = await reviewService.listPropertyReviews(
    propertyId,
    page,
    limit,
  );
  return sendSuccess(res, { items, ratingAvg, ratingCount }, 200, {
    pagination: buildPagination(page, limit, total),
  });
});

export const listMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user!.id;
  const { page, limit } = req.query as unknown as PaginationInput;
  const { items, total } = await reviewService.listMyReviews(actorId, page, limit);
  return sendSuccess(res, items, 200, { pagination: buildPagination(page, limit, total) });
});

export const getReviewEligibility = asyncHandler(async (req: Request, res: Response) => {
  const actorId = req.user!.id;
  const { bookingId } = req.params;
  const result = await reviewService.checkEligibility(
    actorId,
    Array.isArray(bookingId) ? bookingId[0] : bookingId,
  );
  return sendSuccess(res, result);
});
