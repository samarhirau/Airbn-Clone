import { Router } from 'express';
import * as ctrl from '../controllers/property.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam, paginationQuery } from '../validators/common';
import { listPropertyReviews } from '../controllers/review.controller';
import {
  listPropertiesQuery,
  createPropertyBody,
  updatePropertyBody,
  availabilityQuery,
  calendarQuery,
} from '../validators/property.validator';

const router = Router();

// Public search and filtering
router.get('/', validate({ query: listPropertiesQuery }), ctrl.list);

// Live availability (never cached)
router.get('/:id/availability', validate({ params: idParam, query: availabilityQuery }), ctrl.getAvailability);

// Advanced month calendar (day-by-day availability)
router.get('/:id/calendar', validate({ params: idParam, query: calendarQuery }), ctrl.getCalendar);

// Property reviews alias (matches PDF suggested API GET /api/properties/:id/reviews)
router.get(
  '/:id/reviews',
  validate({ params: idParam, query: paginationQuery }),
  (req, res, next) => {
    req.params.propertyId = req.params.id;
    return listPropertyReviews(req, res, next);
  },
);

// Public detail — optional auth lets an owner/admin view their own inactive listing
router.get('/:id', optionalAuthenticate, validate({ params: idParam }), ctrl.getOne);

// Create — owners (and admins) only
router.post('/', authenticate, authorize('owner', 'admin'), validate({ body: createPropertyBody }), ctrl.create);

// Update — owner of the property or admin (enforced in the service)
router.patch(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate({ params: idParam, body: updatePropertyBody }),
  ctrl.update,
);

router.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate({ params: idParam, body: updatePropertyBody }),
  ctrl.update,
);
// Delete — owner of the property or admin
router.delete('/:id', authenticate, authorize('owner', 'admin'), validate({ params: idParam }), ctrl.remove);

export default router;
