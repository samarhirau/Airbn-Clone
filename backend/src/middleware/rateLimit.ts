import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request } from 'express';
import { getRedis, initRedis } from '../config/redis';
import { AppError, ErrorCodes } from '../utils/errors';

// Connect rate limiter to Redis if enabled
function redisStore(prefix: string): RedisStore | undefined {
  const redisEnabled = process.env.REDIS_ENABLED === 'true' || process.env.redisEnabled === 'true';
  const redis = redisEnabled && process.env.REDIS_URL ? getRedis() ?? initRedis() : null;
  if (!redis || !process.env.REDIS_URL) return undefined;
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as Promise<never>,
  });
}

interface LimiterConfig {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
  byUser?: boolean;
}

export function createLimiter({ windowMs, max, prefix, message, byUser }: LimiterConfig) {
  const options: Partial<Options> = {
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: redisStore(prefix),
    passOnStoreError: true,
    skip: () => process.env.NODE_ENV === 'test',
    ...(byUser
      ? { keyGenerator: (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? 'unknown') }
      : {}),
    handler: (_req, _res, next) => {
      next(new AppError(429, ErrorCodes.RATE_LIMITED, message ?? 'Too many requests, please try again later.'));
    },
  };
  return rateLimit(options);
}

// 20 attempts per 15 minutes
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: 'auth',
  message: 'Too many authentication attempts. Please try again in a few minutes.',
});

// 10 account creations per hour
export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  prefix: 'register',
  message: 'Too many accounts created from this network. Please try again later.',
});

// 15 booking attempts per minute
export const bookingLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 15,
  prefix: 'booking',
  byUser: true,
  message: 'Too many booking attempts. Please slow down.',
});

// 10 reviews per minute
export const reviewLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  prefix: 'review',
  byUser: true,
  message: 'Too many review submissions. Please slow down.',
});

// General API surface rate limiter
export const apiLimiter = createLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  prefix: 'api',
  message: 'Too many requests, please try again later.',
});
