import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import healthRoute from './routes/health.route';

export function createApp(): Express {
  const app: Express = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health Check 
  app.get('/api/health', healthRoute);  

  // 404 Handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  return app;
}