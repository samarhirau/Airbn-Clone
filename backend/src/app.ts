import express, { type Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import helmet from 'helmet';
import compression from 'compression';
import { mountSwagger } from './config/swagger';
import { apiLimiter } from './middleware/rateLimit';

import cookieParser from 'cookie-parser';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import healthRoute from './routes/health.route';
import routes from './routes';

export function createApp(): Express {
  const app: Express = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  // Structured HTTP request logging with shared logger (suppress noisy health/favicon pings)
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) =>
          req.url === '/api/health' ||
          req.url === '/health' ||
          req.url === '/favicon.ico',
      },
    }),
  );

  app.use(helmet());

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, origin || true);
        }
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
          return callback(null, origin);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  // Compression
  app.use(compression());

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());

  // Swagger Documentation
  mountSwagger(app);

  // Favicon handler to avoid 404 error logs on browser visits
  app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
  });

  // Root endpoint - deployment status & metadata
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'StayHub API is running',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
    });
  });

  // Health check endpoint at root level for Render / load balancers
  app.use('/health', healthRoute);

  // Distributed rate limiting across all API routes (/api/health, /api/auth, /api/properties, etc.)
  app.use('/api', apiLimiter, routes);

  // 404 and centralized error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}