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
  adminAnalyticsQuery,
} from '../validators/admin.validator';
import { registerPaths } from '../config/swagger';

const router = Router();

// All admin endpoints require an authenticated admin.
router.use(authenticate, authorize('admin'));

// Real platform-wide aggregated metrics.
router.get('/dashboard', ctrl.getDashboard);

// Real platform-wide analytics for chart widgets.
router.get('/analytics', validate({ query: adminAnalyticsQuery }), ctrl.getAnalytics);

// Users: list (filtered) and moderate.

router.get('/users', validate({ query: listUsersQuery }), ctrl.listUsers);
router.patch('/users/:id', validate({ params: idParam, body: updateUserBody }), ctrl.updateUser);

// Properties: list every property (any owner, active + inactive) and moderate.
router.get('/properties', validate({ query: listPropertiesQuery }), ctrl.listProperties);
router.patch(
  '/properties/:id',
  validate({ params: idParam, body: updatePropertyBody }),
  ctrl.updateProperty,
);

// Bookings: list every booking with status / date-range filters.
router.get('/bookings', validate({ query: listBookingsQuery }), ctrl.listBookings);

const errorResponse = { $ref: '#/components/schemas/ErrorResponse' };
const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponse } },
});
const paginationParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
];
const listEnvelope = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { type: 'array', items: { type: 'object' } },
    pagination: { $ref: '#/components/schemas/Pagination' },
  },
};

registerPaths({
  '/admin/dashboard': {
    get: {
      tags: ['Admin'],
      summary: 'Platform-wide aggregated dashboard metrics',
      description:
        'Real aggregation across all users, properties and bookings: user counts by role and ' +
        'active flag; property counts with live occupiedNow/availableNow (active listings with an ' +
        'active booking spanning today vs. the rest of the active inventory); bookings by status; ' +
        'committed revenue (sum of totalPrice for confirmed + completed); and the top 5 cities by ' +
        'property count. Admin only.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Platform dashboard metrics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          customers: { type: 'integer' },
                          owners: { type: 'integer' },
                          admins: { type: 'integer' },
                          active: { type: 'integer' },
                          inactive: { type: 'integer' },
                        },
                      },
                      properties: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          active: { type: 'integer' },
                          inactive: { type: 'integer' },
                          occupiedNow: { type: 'integer' },
                          availableNow: { type: 'integer' },
                        },
                      },
                      bookings: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          pending: { type: 'integer' },
                          confirmed: { type: 'integer' },
                          completed: { type: 'integer' },
                          cancelled: { type: 'integer' },
                        },
                      },
                      revenue: { type: 'number' },
                      topCities: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            city: { type: 'string' },
                            count: { type: 'integer' },
                          },
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
        403: jsonError('Not an admin'),
      },
    },
  },
  '/admin/analytics': {
    get: {
      tags: ['Admin'],
      summary: 'Platform-wide historical revenue, growth, and booking analytics for chart widgets',
      description:
        'Continuous monthly breakdown of platform revenue, user growth trends (customers vs owners), ' +
        'booking status distribution, and top 5 highest earning properties with populated owner details.',
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
          description: 'Aggregated platform analytics data',
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
                      totalPlatformRevenue: { type: 'number' },
                      totalPlatformBookings: { type: 'integer' },
                      monthlyRevenue: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string' },
                            label: { type: 'string' },
                            revenue: { type: 'number' },
                            bookingsCount: { type: 'integer' },
                            completedBookings: { type: 'integer' },
                          },
                        },
                      },
                      monthlyUserGrowth: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string' },
                            label: { type: 'string' },
                            customers: { type: 'integer' },
                            owners: { type: 'integer' },
                            total: { type: 'integer' },
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
                      topRevenueProperties: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            propertyId: { type: 'string' },
                            title: { type: 'string' },
                            city: { type: 'string' },
                            ownerName: { type: 'string' },
                            revenue: { type: 'number' },
                            bookingsCount: { type: 'integer' },
                          },
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
        403: jsonError('Not an admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
  '/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List all users (filtered, paginated)',
      description:
        'Newest first. Filters: role, isActive, and q (case-insensitive match on name or email). ' +
        'passwordHash is never returned. Admin only.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        {
          name: 'role',
          in: 'query',
          schema: { type: 'string', enum: ['customer', 'owner', 'admin'] },
        },
        { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Match name or email' },
      ],
      responses: {
        200: {
          description: 'Paginated users plus pagination meta',
          content: { 'application/json': { schema: listEnvelope } },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
  '/admin/users/{id}': {
    patch: {
      tags: ['Admin'],
      summary: "Update a user's active flag and/or role",
      description:
        'At least one of isActive/role is required. An admin may not deactivate their own account ' +
        'or change their own role (400). Deactivation or a role change bumps the token version, ' +
        'immediately invalidating that user\'s outstanding access tokens. Admin only.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              minProperties: 1,
              properties: {
                isActive: { type: 'boolean' },
                role: { type: 'string', enum: ['customer', 'owner', 'admin'] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated user (no passwordHash)' },
        400: jsonError('Cannot deactivate or change the role of your own account'),
        401: jsonError('Not authenticated'),
        403: jsonError('Not an admin'),
        404: jsonError('User not found'),
        422: jsonError('Validation failed (no fields provided or invalid values)'),
      },
    },
  },
  '/admin/properties': {
    get: {
      tags: ['Admin'],
      summary: 'List all properties (any owner, active + inactive)',
      description:
        'Newest first, owner (name/email) populated. Filters: q (title or city), city, ' +
        'propertyType, isActive, ownerId. Admin only.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Match title or city' },
        { name: 'city', in: 'query', schema: { type: 'string' } },
        { name: 'propertyType', in: 'query', schema: { type: 'string' } },
        { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'ownerId', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Paginated properties plus pagination meta',
          content: { 'application/json': { schema: listEnvelope } },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
  '/admin/properties/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'Moderate a property (toggle isActive)',
      description: 'At least one field (isActive) is required. Admin only.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              minProperties: 1,
              properties: { isActive: { type: 'boolean' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated property' },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an admin'),
        404: jsonError('Property not found'),
        422: jsonError('Validation failed (no fields provided or invalid values)'),
      },
    },
  },
  '/admin/bookings': {
    get: {
      tags: ['Admin'],
      summary: 'List all bookings (filtered, paginated)',
      description:
        'Newest first. Customer (name/email), property (title/city) and owner (name/email) are ' +
        'populated. Filters: status and an optional from/to (ISO) inclusive range on checkIn. ' +
        'Admin only.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...paginationParams,
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
        },
        { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
        { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
      ],
      responses: {
        200: {
          description: 'Paginated bookings plus pagination meta',
          content: { 'application/json': { schema: listEnvelope } },
        },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
});

export default router;
