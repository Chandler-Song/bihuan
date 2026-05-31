import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: 'Too many requests' },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: 'Too many auth requests' },
});
