import { getRedis, isRedisReady } from '../config/redis';
import { logger } from '../config/logger';


export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisReady()) return null;
  try {
    const raw = await getRedis()!.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    logger.debug({ err, key }, 'cacheGet failed');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await getRedis()!.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.debug({ err, key }, 'cacheSet failed');
  }
}

export async function cacheDel(keys: string | string[]): Promise<void> {
  if (!isRedisReady()) return;
  const list = Array.isArray(keys) ? keys : [keys];
  if (!list.length) return;
  try {
    await getRedis()!.del(...list);
  } catch (err) {
    logger.debug({ err, keys }, 'cacheDel failed');
  }
}

/** Atomically increment a counter (used for cache-version bumping). Returns new value or null. */
export async function cacheIncr(key: string): Promise<number | null> {
  if (!isRedisReady()) return null;
  try {
    return await getRedis()!.incr(key);
  } catch (err) {
    logger.debug({ err, key }, 'cacheIncr failed');
    return null;
  }
}

export async function cacheGetNumber(key: string): Promise<number> {
  const v = await cacheGet<number>(key);
  return typeof v === 'number' ? v : 0;
}

/**
 * Cache-aside helper: return cached value if present, otherwise run `producer`,
 * cache the result, and return it. Falls back to `producer` on any cache issue.
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await producer();
  // Only cache non-null/undefined values.
  if (value !== null && value !== undefined) await cacheSet(key, value, ttlSeconds);
  return value;
}
