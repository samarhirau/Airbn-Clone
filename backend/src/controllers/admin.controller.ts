import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPagination } from '../utils/apiResponse';
import * as adminService from '../services/admin.service';
import type {
	ListUsersQuery,
	UpdateUserBody,
	ListPropertiesQuery,
	UpdatePropertyBody,
	ListBookingsQuery,
	AdminAnalyticsQuery,
} from '../validators/admin.validator';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
	const dashboard = await adminService.getAdminDashboard();
	return sendSuccess(res, dashboard);
});

/** GET /api/admin/analytics — platform-wide historical analytics for chart widgets. */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { months } = req.query as unknown as AdminAnalyticsQuery;
  const analytics = await adminService.getAdminAnalytics(months);
  return sendSuccess(res, analytics);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as unknown as ListUsersQuery;
	const { items, total } = await adminService.listUsers(query);
	return sendSuccess(res, items, 200, { pagination: buildPagination(query.page, query.limit, total) });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
	const changes = req.body as UpdateUserBody;
	const user = await adminService.updateUser(req.user!.id, String(req.params.id), changes);
	return sendSuccess(res, { user });
});

export const listProperties = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as unknown as ListPropertiesQuery;
	const { items, total } = await adminService.listAllProperties(query);
	return sendSuccess(res, items, 200, { pagination: buildPagination(query.page, query.limit, total) });
});

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
	const changes = req.body as UpdatePropertyBody;
	const property = await adminService.updateProperty(String(req.params.id), changes);
	return sendSuccess(res, { property });
});

export const listBookings = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query as unknown as ListBookingsQuery;
	const { items, total } = await adminService.listAllBookings(query);
	return sendSuccess(res, items, 200, { pagination: buildPagination(query.page, query.limit, total) });
});
