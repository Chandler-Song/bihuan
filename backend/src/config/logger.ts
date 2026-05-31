import pino from 'pino';
import { env, isProd } from './env';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.code', 'body.password', 'body.code'],
    remove: false,
    censor: '***',
  },
});

export const APP_NAME = 'bihuan';
export const TOKEN_TTL = env.JWT_EXPIRES_IN;
