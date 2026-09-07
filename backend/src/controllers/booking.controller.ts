import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, buildPagination } from '../utils/apiResponse';
import { AppError } from '../utils/errors';
import * as bookingService from '../services/booking.service';
import type { CreateBookingInput, ListBookingsInput, CancelBookingInput } from '../validators/booking.validator';


export const create = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw AppError.unauthorized();
  const booking = await bookingService.createBooking(userId, req.body as CreateBookingInput);
  return sendSuccess(res, { booking }, 201);
});

export const listMine = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw AppError.unauthorized();
  const { page, limit, status } = req.query as unknown as ListBookingsInput;
  const { items, total } = await bookingService.listMyBookings(userId, { page, limit, status });
  return sendSuccess(res, { bookings: items }, 200, { pagination: buildPagination(page, limit, total) });
});

export const getOne = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw AppError.unauthorized();
  const booking = await bookingService.getBookingById(req.params.id as string, user.id, user.role);
  return sendSuccess(res, { booking }, 200);
});

export const cancel = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw AppError.unauthorized();
  const { reason } = req.body as CancelBookingInput;
  const booking = await bookingService.cancelBooking(req.params.id as string, user.id, user.role, reason);
  return sendSuccess(res, { booking }, 200);
});
