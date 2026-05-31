import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('connect', () => logger.info('redis connected'));
redis.on('error', (e: Error) => logger.error({ err: e }, 'redis error'));
