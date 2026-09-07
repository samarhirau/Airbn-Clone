import { Router } from 'express';
import * as ctrl from '../controllers/owner.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common';
import { ownerBookingsQuery, ownerListQuery } from '../validators/owner.validator';

const router = Router();

// Owner and Admin authorization guard
router.use(authenticate, authorize('owner', 'admin'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/properties', validate({ query: ownerListQuery }), ctrl.listProperties);
router.get('/bookings', validate({ query: ownerBookingsQuery }), ctrl.listBookings);
router.get(
  '/properties/:id/bookings',
  validate({ params: idParam, query: ownerListQuery }),
  ctrl.listPropertyBookings,
);

export default router;
