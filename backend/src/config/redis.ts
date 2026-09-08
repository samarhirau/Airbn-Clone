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

  const redisUrl = process.env.REDIS_URL;
  const isTls =
    redisUrl.startsWith('rediss://') ||
    redisUrl.includes('upstash.io') ||
    redisUrl.includes(':6380');

  client = new Redis(redisUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: true,
    keepAlive: 10000,
    family: 4,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    retryStrategy: (times) => {
      if (times > 10) {
        logger.warn('Redis reconnect attempts exhausted (10) — continuing without Redis cache');
        return null;
      }
      return Math.min(times * 300, 3000);
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((target) => err.message.includes(target));
    },
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
