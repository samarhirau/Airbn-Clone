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
import { registerPaths } from '../config/swagger';

const router = Router();

// Public search.
router.get('/', validate({ query: listPropertiesQuery }), ctrl.list);

// Live availability (declared before `/:id` for clarity; distinct path depth anyway).
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

// Public detail — optional auth lets an owner/admin view their own inactive listing.
router.get('/:id', optionalAuthenticate, validate({ params: idParam }), ctrl.getOne);

// Create — owners (and admins) only.
router.post('/', authenticate, authorize('owner', 'admin'), validate({ body: createPropertyBody }), ctrl.create);

// Update — owner of the property or admin (enforced in the service).
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

// Delete — owner of the property or admin (blocked if the property has bookings).
router.delete('/:id', authenticate, authorize('owner', 'admin'), validate({ params: idParam }), ctrl.remove);

const errorResponse = { $ref: '#/components/schemas/ErrorResponse' };
const jsonError = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorResponse } },
});
const propertyBodySchema = {
  type: 'object',
  required: ['title', 'description', 'location', 'pricePerNight', 'propertyType', 'maxGuests', 'bedrooms', 'bathrooms'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 160 },
    description: { type: 'string', minLength: 1, maxLength: 5000 },
    location: {
      type: 'object',
      required: ['city'],
      properties: {
        address: { type: 'string' },
        area: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
        },
      },
    },
    pricePerNight: { type: 'number', exclusiveMinimum: 0 },
    propertyType: {
      type: 'string',
      enum: ['apartment', 'house', 'villa', 'condo', 'cabin', 'studio', 'room', 'cottage', 'loft', 'other'],
    },
    maxGuests: { type: 'integer', minimum: 1 },
    bedrooms: { type: 'integer', minimum: 0 },
    bathrooms: { type: 'integer', minimum: 0 },
    amenities: { type: 'array', items: { type: 'string' } },
    images: {
      type: 'array',
      items: {
        type: 'object',
        required: ['url'],
        properties: { url: { type: 'string', format: 'uri' }, publicId: { type: 'string' } },
      },
    },
  },
};

registerPaths({
  '/properties': {
    get: {
      tags: ['Properties'],
      summary: 'Search properties (public, filtered, paginated)',
      description:
        'Lists ACTIVE properties only. Filters: q (full-text over title/description/area/city), city ' +
        '(case-insensitive), propertyType, minPrice/maxPrice, guests (maxGuests >= guests), bedrooms, ' +
        'proximity search (lat, lng, radiusKm) or map bounding box (bounds=south,west,north,east). ' +
        'sort ∈ newest|price_asc|price_desc|rating (default newest).',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        { name: 'q', in: 'query', schema: { type: 'string' } },
        { name: 'city', in: 'query', schema: { type: 'string' } },
        {
          name: 'propertyType',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['apartment', 'house', 'villa', 'condo', 'cabin', 'studio', 'room', 'cottage', 'loft', 'other'],
          },
        },
        { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
        { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
        { name: 'guests', in: 'query', schema: { type: 'integer', minimum: 1 } },
        { name: 'bedrooms', in: 'query', schema: { type: 'integer', minimum: 0 } },
        { name: 'amenities', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
        { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'User latitude for proximity search' },
        { name: 'lng', in: 'query', schema: { type: 'number' }, description: 'User longitude for proximity search' },
        { name: 'radiusKm', in: 'query', schema: { type: 'number', default: 50 }, description: 'Search radius in km' },
        { name: 'bounds', in: 'query', schema: { type: 'string' }, description: 'Map bounding box: south,west,north,east' },
        {
          name: 'sort',
          in: 'query',
          schema: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'rating'] },
        },
      ],
      responses: {
        200: {
          description: 'Paginated properties plus pagination meta',
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
        422: jsonError('Validation failed'),
      },
    },
    post: {
      tags: ['Properties'],
      summary: 'Create a property listing',
      description:
        'Owner/admin only. The owner is taken from the access token — any owner field in the body is ' +
        'ignored. pricePerNight must be > 0.',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: propertyBodySchema } } },
      responses: {
        201: { description: 'Property created' },
        401: jsonError('Not authenticated'),
        403: jsonError('Not an owner or admin'),
        422: jsonError('Validation failed'),
      },
    },
  },
  '/properties/{id}': {
    get: {
      tags: ['Properties'],
      summary: 'Get a property by id (public)',
      description:
        'Returns an active property to anyone. An inactive listing is hidden (404) unless the caller ' +
        'is an admin or its owner (send a Bearer token to see your own inactive listing).',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'The property' },
        404: jsonError('Property not found'),
        422: jsonError('Invalid id'),
      },
    },
    patch: {
      tags: ['Properties'],
      summary: 'Update a property (owner of it, or admin)',
      description:
        'Partial update; at least one field required. Ownership is enforced server-side. Use ' +
        'isActive:false to deactivate a listing instead of deleting it.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', minProperties: 1, properties: propertyBodySchema.properties },
          },
        },
      },
      responses: {
        200: { description: 'Updated property' },
        401: jsonError('Not authenticated'),
        403: jsonError('Not the owner or an admin'),
        404: jsonError('Property not found'),
        422: jsonError('Validation failed'),
      },
    },
    delete: {
      tags: ['Properties'],
      summary: 'Delete a property (owner of it, or admin)',
      description:
        'Ownership enforced server-side. Refused with 409 if the property has any pending/confirmed/' +
        'completed booking (deactivate it instead). Cancelled-only bookings do not block deletion.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Property deleted' },
        401: jsonError('Not authenticated'),
        403: jsonError('Not the owner or an admin'),
        404: jsonError('Property not found'),
        409: jsonError('Property has bookings and cannot be deleted'),
        422: jsonError('Invalid id'),
      },
    },
  },
  '/properties/{id}/availability': {
    get: {
      tags: ['Properties'],
      summary: 'Live availability / occupancy for a property',
      description:
        'Computed live from bookings (never cached). Returns current occupancy (occupied, occupiedUntil, ' +
        'nextAvailableDate, upcomingBooking). Supply both checkIn and checkOut to also get ' +
        'requestedRangeAvailable for that stay.',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'checkIn', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'checkOut', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: {
        200: { description: 'Occupancy info (+ requestedRangeAvailable when a range is supplied)' },
        400: jsonError('checkOut must be after checkIn'),
        404: jsonError('Property not found'),
        422: jsonError('Validation failed'),
      },
    },
  },
});

export default router;
