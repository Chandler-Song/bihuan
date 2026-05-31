import { redis } from '../redis';
import { logger } from '../config/logger';

export async function withLock<T>(name: string, ttl: number, fn: () => Promise<T>): Promise<T | undefined> {
  const key = `job:${name}:lock`;
  const got = await redis.set(key, '1', 'EX', ttl, 'NX');
  if (got !== 'OK') {
    logger.debug({ name }, 'job locked, skip');
    return undefined;
  }
  try {
    return await fn();
  } finally {
    await redis.del(key).catch(() => undefined);
  }
}
