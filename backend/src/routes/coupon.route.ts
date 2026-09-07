import { Router } from 'express';
import * as ctrl from '../controllers/coupon.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common';
import { createCouponBody, validateCouponBody, listCouponsQuery } from '../validators/coupon.validator';

const router = Router();

// Customer/Any authenticated user validates coupon
router.post('/validate', authenticate, validate({ body: validateCouponBody }), ctrl.validate);

// Admin & Owner management routes
router.post('/', authenticate, authorize('admin', 'owner'), validate({ body: createCouponBody }), ctrl.create);
router.get('/', authenticate, authorize('admin', 'owner'), validate({ query: listCouponsQuery }), ctrl.list);
router.patch('/:id/toggle', authenticate, authorize('admin', 'owner'), validate({ params: idParam }), ctrl.toggleActive);

export default router;
