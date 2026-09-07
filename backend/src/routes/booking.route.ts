import { Router } from 'express';
import * as ctrl from '../controllers/booking.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common';
import { createBookingBody, listBookingsQuery, cancelBookingBody } from '../validators/booking.validator';
import { bookingLimiter } from '../middleware/rateLimit';
import { registerPaths } from '../config/swagger';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// Create a booking — customers only
router.post(
  '/',
  bookingLimiter,
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


const bookingSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    customer: { type: 'string' },
    property: { type: 'string' },
    owner: { type: 'string' },
    checkIn: { type: 'string', format: 'date-time' },
    checkOut: { type: 'string', format: 'date-time' },
    guests: { type: 'integer' },
    numberOfNights: { type: 'integer' },
    pricePerNight: { type: 'number' },
    totalPrice: { type: 'number' },
    status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
  },
};


registerPaths({
  '/bookings': {
    post: {
      tags: ['Bookings'],
      summary: 'Create a booking (concurrency-safe, prevents double-booking)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['propertyId', 'checkIn', 'checkOut', 'guests'],
              properties: {
                propertyId: { type: 'string' },
                checkIn: { type: 'string', format: 'date', example: '2026-10-01' },
                checkOut: { type: 'string', format: 'date', example: '2026-10-05' },
                guests: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Booking confirmed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object', properties: { booking: bookingSchema } },
                },
              },
            },
          },
        },
        400: { description: 'Invalid dates/guests', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Not a customer / cannot book own property', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Property not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        409: { description: 'Dates unavailable (booking conflict)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    get: {
      tags: ['Bookings'],
      summary: "List the authenticated customer's bookings",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] } },
      ],
      responses: {
        200: {
          description: 'Paginated bookings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object', properties: { bookings: { type: 'array', items: bookingSchema } } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/bookings/{id}': {
    get: {
      tags: ['Bookings'],
      summary: 'Get a booking by id (customer, property owner, or admin)',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'The booking' },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
  '/bookings/{id}/cancel': {
    patch: {
      tags: ['Bookings'],
      summary: 'Cancel a booking (owning customer or admin) before check-in',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { reason: { type: 'string', maxLength: 500 } } },
          },
        },
      },
      responses: {
        200: { description: 'Booking cancelled' },
        403: { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        409: { description: 'Not cancellable (already cancelled/completed or stay started)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
});



export default router;
