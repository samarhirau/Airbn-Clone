import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import * as couponService from '../services/coupon.service';
import type { CreateCouponInput, ValidateCouponInput, ListCouponsQuery } from '../validators/coupon.validator';

// Validate coupon for checkout
export const validate = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ValidateCouponInput;
  const result = await couponService.validateCoupon(input.code, input.bookingAmount);
  res.json(apiResponse(result));
});

// Create coupon (admin/owner)
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateCouponInput;
  const coupon = await couponService.createCoupon(req.user!.id, input);
  res.status(201).json(apiResponse(coupon));
});

// List coupons (admin/owner)
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListCouponsQuery;
  const { items, total } = await couponService.listCoupons(query);
  res.json(apiResponse(items, { page: query.page, limit: query.limit, total }));
});

// Toggle coupon active status
export const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const coupon = await couponService.toggleCouponActive(id);
  res.json(apiResponse(coupon));
});
