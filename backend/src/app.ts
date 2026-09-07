import express, { type Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';

import cookieParser from 'cookie-parser';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import healthRoute from './routes/health.route';
import authRoute from './routes/auth.route';
import propertyRoute from './routes/property.route';

export function createApp(): Express {
  const app: Express = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  // Structured HTTP request logging with shared logger
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    }),
  );

  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );


   app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());


  // Health Check 
  app.use('/api/health', healthRoute);  
  app.use('/api/auth', authRoute);
    app.use('/api/properties', propertyRoute);

  // 404 and centralized error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}