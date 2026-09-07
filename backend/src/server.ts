import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase, ensureIndexes } from './config/db.js';
import type { Server } from 'node:http';
import { logger } from './config/logger';
import { initRedis, disconnectRedis } from './config/redis';
import { startJobs, stopJobs } from './jobs';

async function bootstrap(): Promise<void> {
  // Fail fast if database is unreachable (source of truth)
  await connectDatabase();

   // Sync indexes explicitly when autoIndex is disabled
  if (process.env.NODE_ENV === 'production') {
    await ensureIndexes();
  }
  
  // Initialize Redis with graceful degradation
  initRedis();
  startJobs();

  const app = createApp();
  const server: Server = app.listen(process.env.PORT, () => {
    logger.info(`StayHub API listening on port ${process.env.PORT} (${process.env.NODE_ENV})`);
  });
  const shutdown = async (signal: string): Promise<void> => {
    stopJobs();
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await disconnectDatabase().catch((err) => logger.error({ err }, 'DB disconnect error'));
      await disconnectRedis().catch((err) => logger.error({ err }, 'Redis disconnect error'));
      logger.info('Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception — exiting');
  process.exit(1);
});
bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});