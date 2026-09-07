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
import { reviewLimiter } from '../middleware/rateLimit';
import { registerPaths } from '../config/swagger';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('customer'),
  reviewLimiter,
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


registerPaths({
  '/reviews': {
    post: {
      tags: ['Reviews'],
      summary: 'Create a review for a completed booking',
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: 'Review created' } },
    },
  },
  '/reviews/me': {
    get: {
      tags: ['Reviews'],
      summary: 'List caller reviews',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Reviews list' } },
    },
  },
  '/reviews/eligibility/{bookingId}': {
    get: {
      tags: ['Reviews'],
      summary: 'Check review eligibility',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Eligibility status' } },
    },
  },
  '/reviews/property/{propertyId}': {
    get: {
      tags: ['Reviews'],
      summary: 'Public property reviews',
      responses: { 200: { description: 'Property reviews list' } },
    },
  },
});


export default router;
