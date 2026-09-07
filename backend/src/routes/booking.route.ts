import { Router } from 'express';
import * as ctrl from '../controllers/booking.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common';
import { createBookingBody, listBookingsQuery, cancelBookingBody } from '../validators/booking.validator';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Create a booking — customers only
router.post(
  '/',
  authorize('customer'),
  validate({ body: createBookingBody }),
  ctrl.create,
);

// List the authenticated customer's own bookings
router.get('/', authorize('customer'), validate({ query: listBookingsQuery }), ctrl.listMine);

// Get a single booking — accessible to its customer, the property owner, or an admin
router.get('/:id', validate({ params: idParam }), ctrl.getOne);

// Cancel a booking — the owning customer or an admin
router.patch(
  '/:id/cancel',
  authorize('customer', 'admin'),
  validate({ params: idParam, body: cancelBookingBody }),
  ctrl.cancel,
);

export default router;
