import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { Errors } from '../utils/errors';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return next(Errors.unauthorized('Missing token'));
  try {
    const payload = verifyToken(m[1]);
    req.user = payload;
    next();
  } catch {
    next(Errors.unauthorized('Invalid token'));
  }
}
