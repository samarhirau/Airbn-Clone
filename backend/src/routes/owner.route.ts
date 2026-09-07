import { Router } from 'express';
import * as ctrl from '../controllers/owner.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common';
import { ownerBookingsQuery, ownerListQuery, ownerAnalyticsQuery } from '../validators/owner.validator';
import { registerPaths } from '../config/swagger';


const router = Router();

// All owner endpoints require an authenticated owner (or admin).
router.use(authenticate, authorize('owner', 'admin'));

// Aggregated dashboard metrics for the acting owner.
router.get('/dashboard', ctrl.getDashboard);

// Analytics & chart time-series aggregation for the acting owner.
router.get('/analytics', validate({ query: ownerAnalyticsQuery }), ctrl.getAnalytics);

// The owner's properties (active + inactive), newest first, with live occupancy.

router.get('/properties', validate({ query: ownerListQuery }), ctrl.listProperties);

// The owner's bookings, newest first, optional status filter.
router.get('/bookings', validate({ query: ownerBookingsQuery }), ctrl.listBookings);

// Bookings for a single owned property (ownership-checked in the service).
router.get(
  '/properties/:id/bookings',
  validate({ params: idParam, query: ownerListQuery }),
  ctrl.listPropertyBookings,
);

const errorResponse = { $ref: '#/components/schemas/ErrorResponse' };
const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponse } },
});
const paginationParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
];

registerPaths({
  '/owner/dashboard': {
    get: {
      tags: ['Owner'],
      summary: 'Aggregated dashboard metrics for the acting owner',
      description:
        'Real aggregation over the owner\'s own properties and bookings: property counts, ' +
        'bookings-by-status, upcoming/occupied counts, and committed revenue (sum of totalPrice ' +
        'for confirmed + completed bookings). Scoped to req.user.id, even for admins.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Owner dashboard metrics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      totalProperties: { type: 'integer' },
                      activeProperties: { type: 'integer' },
                      inactiveProperties: { type: 'integer' },
                      totalBookings: { type: 'integer' },
                      bookingsByStatus: {
                        type: 'object',
                        properties: {
                          pending: { type: 'integer' },
                          confirmed: { type: 'integer' },
                          completed: { type: 'integer' },
                          cancelled: { type: 'integer' },
                        },
                      },
                      upcomingBookings: { type: 'integer' },
                      occupiedNow: { type: 'integer' },
                      totalRevenue: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an owner/admin'),
      },
    },
  },
  '/owner/analytics': {
    get: {
      tags: ['Owner'],
      summary: 'Historical revenue and bookings analytics for chart widgets',
      description:
        'Continuous monthly breakdown of revenue and bookings for the past N months (filling 0s for months without bookings), ' +
        'property revenue breakdown, and booking status distribution.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'months',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 24, default: 6 },
          description: 'Number of past months to aggregate',
        },
      ],
      responses: {
        200: {
          description: 'Aggregated analytics data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      periodMonths: { type: 'integer' },
                      startDate: { type: 'string', format: 'date-time' },
                      totalRevenue: { type: 'number' },
                      totalBookings: { type: 'integer' },
                      monthly: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string' },
                            label: { type: 'string' },
                            revenue: { type: 'number' },
                            bookingsCount: { type: 'integer' },
                            completedBookings: { type: 'integer' },
                            cancelledBookings: { type: 'integer' },
                          },
                        },
                      },
                      propertyBreakdown: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            propertyId: { type: 'string' },
                            title: { type: 'string' },
                            revenue: { type: 'number' },
                            bookingsCount: { type: 'integer' },
                          },
                        },
                      },
                      bookingStatusDistribution: {
                        type: 'object',
                        properties: {
                          pending: { type: 'integer' },
                          confirmed: { type: 'integer' },
                          completed: { type: 'integer' },
                          cancelled: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an owner/admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
  '/owner/properties': {
    get: {
      tags: ['Owner'],
      summary: "List the owner's properties with live occupancy",
      description: "Paginated, newest first. Includes active and inactive properties, each enriched with occupancy (occupied, occupiedUntil, nextAvailableDate, upcomingBooking).",
      security: [{ bearerAuth: [] }],
      parameters: paginationParams,
      responses: {
        200: {
          description: 'Paginated properties with occupancy plus pagination meta',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        isActive: { type: 'boolean' },
                        occupancy: {
                          type: 'object',
                          properties: {
                            occupied: { type: 'boolean' },
                            occupiedUntil: { type: 'string', format: 'date-time', nullable: true },
                            nextAvailableDate: { type: 'string', format: 'date-time' },
                            upcomingBooking: {
                              type: 'object',
                              nullable: true,
                              properties: {
                                checkIn: { type: 'string', format: 'date-time' },
                                checkOut: { type: 'string', format: 'date-time' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an owner/admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
  '/owner/bookings': {
    get: {
      tags: ['Owner'],
      summary: "List the owner's bookings",
      description: 'Paginated, newest first. Optional status filter. Customer (name/email) and property (title/city) are populated.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
        },
      ],
      responses: {
        200: {
          description: 'Paginated bookings plus pagination meta',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'array', items: { type: 'object' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an owner/admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
  '/owner/properties/{id}/bookings': {
    get: {
      tags: ['Owner'],
      summary: 'List bookings for one owned property',
      description: 'Ownership-checked: 404 if the property is missing, 403 if it belongs to another owner (admins may view any). Paginated, newest first, with the customer name populated.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, ...paginationParams],
      responses: {
        200: {
          description: 'Paginated bookings for the property plus pagination meta',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'array', items: { type: 'object' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Property belongs to another owner'),
        404: jsonError('Property not found'),
        422: jsonError('Validation failed'),
      },
    },
  },
});

export default router;
