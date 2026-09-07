import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { registerBody, loginBody, updateProfileBody, googleAuthBody } from '../validators/auth.validator';
import { authLimiter, registerLimiter } from '../middleware/rateLimit';
import { registerPaths } from '../config/swagger';

const router = Router();

router.post('/register', registerLimiter, validate({ body: registerBody }), ctrl.register);
router.post('/login', authLimiter, validate({ body: loginBody }), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.patch('/me', authenticate, validate({ body: updateProfileBody }), ctrl.updateProfile);
router.post('/google', authLimiter, validate({ body: googleAuthBody }), ctrl.googleAuth);


const authUserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string', enum: ['customer', 'owner', 'admin'] },
    phone: { type: 'string', nullable: true },
    avatar: { type: 'string', nullable: true },
    bio: { type: 'string', nullable: true },
    isActive: { type: 'boolean' },
  },
};
registerPaths({
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new account and start a session',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password'],
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8, maxLength: 72 },
                role: { type: 'string', enum: ['customer', 'owner'] },
                phone: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Account created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: { user: authUserSchema, accessToken: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
        409: { description: 'Email already registered' },
        422: { description: 'Validation error' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Log in with email + password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Authenticated' },
        401: { description: 'Invalid credentials' },
      },
    },
  },
   '/auth/google': {
    post: {
      tags: ['Auth'],
      summary: 'Authenticate via Google ID token (sign up or login)',
      description: 'Verifies the Google ID token, upserts the user, sets the refresh cookie, and returns the access token.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['idToken'],
              properties: {
                idToken: { type: 'string', description: 'Google ID token from Google Identity Services' },
                role: { type: 'string', enum: ['customer', 'owner'], default: 'customer' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Authenticated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: { user: authUserSchema, accessToken: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Invalid Google token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        403: { description: 'Account deactivated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Rotate the refresh cookie and issue a new access token',
      responses: {
        200: { description: 'Token refreshed' },
        401: { description: 'Invalid/expired session' },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Revoke session family and clear cookie',
      responses: { 200: { description: 'Logged out' } },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Current profile' },
        401: { description: 'Not authenticated' },
      },
    },
    patch: {
      tags: ['Auth'],
      summary: 'Update current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Updated profile' },
        401: { description: 'Not authenticated' },
      },
    },
  },
});

export default router;
