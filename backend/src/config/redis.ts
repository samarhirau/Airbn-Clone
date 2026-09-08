import Redis from 'ioredis';
import { logger } from './logger';

let client: Redis | null = null;
let ready = false;

export function initRedis(): Redis | null {
  const redisEnabled =
    process.env.REDIS_ENABLED === 'true' ||
    process.env.redisEnabled === 'true';

  if (!redisEnabled || !process.env.REDIS_URL) {
    logger.warn(
      'Redis not configured — caching disabled, using in-memory rate limiting'
    );
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
    ...(isTls
      ? {
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {}),
    retryStrategy: (times) => {
      if (times > 10) {
        logger.warn('Redis reconnect attempts exhausted (10) — continuing without Redis cache');
        return null;
      }
      return Math.min(times * 500, 5000);
    },
  });

  client.on('ready', () => {
    ready = true;
    logger.info('Redis connected');
  });

  client.on('end', () => {
    ready = false;
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', (delay: number) => {
    ready = false;
    logger.warn({ delay }, 'Redis reconnecting...');
  });

  client.on('error', (err) => {
    ready = false;
    logger.warn(
      { err: err.message },
      'Redis error (continuing without cache)'
    );
  });

  return client;
}

export function getRedis(): Redis | null {
  return client;
}

export function isRedisReady(): boolean {
  return Boolean(client && ready);
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => {
      client?.disconnect();
    });

    client = null;
    ready = false;
  }
}
