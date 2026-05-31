import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3001'), 10),

  // SQLite
  SQLITE_PATH: optional('SQLITE_PATH', './data/bihuan.db'),

  // Redis
  REDIS_URL: optional('REDIS_URL', 'redis://127.0.0.1:6379'),

  // JWT
  JWT_SECRET: optional('JWT_SECRET', 'dev-secret-please-change'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  // Mail
  MAIL_HOST: optional('MAIL_HOST'),
  MAIL_PORT: parseInt(optional('MAIL_PORT', '465'), 10),
  MAIL_USER: optional('MAIL_USER'),
  MAIL_PASS: optional('MAIL_PASS'),
  MAIL_FROM: optional('MAIL_FROM', '"BiHuan" <noreply@example.com>'),

  // Qwen
  QWEN_API_KEY: optional('QWEN_API_KEY'),
  QWEN_MODEL: optional('QWEN_MODEL', 'qwen-plus'),
  QWEN_BASE_URL: optional(
    'QWEN_BASE_URL',
    'https://dashscope.aliyuncs.com/compatible-mode/v1'
  ),
};

export const isProd = env.NODE_ENV === 'production';
