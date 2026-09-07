import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export const openapiSpec: Record<string, unknown> = {
  openapi: '3.0.3',
  info: {
    title: 'StayHub API',
    version: '1.0.0',
    description: 'Production-grade Airbnb-clone REST API with TypeScript, MongoDB, and Redis.',
  },
  servers: [{ url: '/api', description: process.env.NODE_ENV }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
              requestId: { type: 'string' },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  security: [],
  tags: [
    { name: 'Auth' },
    { name: 'Properties' },
    { name: 'Bookings' },
    { name: 'Reviews' },
    { name: 'Wishlist' },
    { name: 'Owner' },
    { name: 'Admin' },
    { name: 'Health' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health & dependency status',
        responses: { 200: { description: 'Health snapshot' } },
      },
    },
  },
};

export function registerPaths(paths: Record<string, unknown>): void {
  Object.assign(openapiSpec.paths as Record<string, unknown>, paths);
}

export function mountSwagger(app: Express): void {
  app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'StayHub API Docs' }));
}
