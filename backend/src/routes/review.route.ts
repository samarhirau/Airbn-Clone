import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { paginationQuery } from '../validators/common';
import { createReviewBody, propertyIdParams, bookingIdParams } from '../validators/review.validator';
import {
  createReview,
  listPropertyReviews,
  listMyReviews,
  getReviewEligibility,
} from '../controllers/review.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('customer'),
  validate({ body: createReviewBody }),
  createReview,
);

router.get('/me', authenticate, authorize('customer'), validate({ query: paginationQuery }), listMyReviews);

router.get(
  '/eligibility/:bookingId',
  authenticate,
  authorize('customer'),
  validate({ params: bookingIdParams }),
  getReviewEligibility,
);

router.get(
  '/property/:propertyId',
  validate({ params: propertyIdParams, query: paginationQuery }),
  listPropertyReviews,
);

export default router;
