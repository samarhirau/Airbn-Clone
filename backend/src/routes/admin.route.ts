import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common';
import {
  listUsersQuery,
  updateUserBody,
  listPropertiesQuery,
  updatePropertyBody,
  listBookingsQuery,
} from '../validators/admin.validator';

const router = Router();

// Admin authorization guard
router.use(authenticate, authorize('admin'));

router.get('/dashboard', ctrl.getDashboard);

router.get('/users', validate({ query: listUsersQuery }), ctrl.listUsers);
router.patch('/users/:id', validate({ params: idParam, body: updateUserBody }), ctrl.updateUser);

router.get('/properties', validate({ query: listPropertiesQuery }), ctrl.listProperties);
router.patch(
  '/properties/:id',
  validate({ params: idParam, body: updatePropertyBody }),
  ctrl.updateProperty,
);

router.get('/bookings', validate({ query: listBookingsQuery }), ctrl.listBookings);

export default router;
