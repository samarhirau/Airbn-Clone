import Redis from 'ioredis';
import { logger } from './logger';



let client: Redis | null = null;
let ready = false;

export function initRedis(): Redis | null {
  const redisEnabled = process.env.REDIS_ENABLED === 'true' || process.env.redisEnabled === 'true';
  if (!redisEnabled || !process.env.REDIS_URL) {
    logger.warn('Redis not configured (REDIS_URL missing) — caching disabled, in-memory rate limiting');
    return null;
  }
  if (client) return client;

  client = new Redis(process.env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    reconnectOnError: () => true,
  });

  client.on('ready', () => {
    ready = true;
    logger.info('Redis connected');
  });
  client.on('end', () => {
    ready = false;
  });
  client.on('error', (err) => {
    ready = false;
    // Do not crash — log at warn level and keep serving from Mongo.
    logger.warn({ err: err.message }, 'Redis error (continuing without cache)');
  });

  return client;
}

export function getRedis(): Redis | null {
  return client;
}

export function isRedisReady(): boolean {
  return Boolean(client) && ready;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => client?.disconnect());
    client = null;
    ready = false;
  }
}
