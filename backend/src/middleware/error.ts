import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { HttpError } from '../utils/errors';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ code: 404, message: 'Not Found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 400,
      message: 'ValidationError',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ code: err.code, message: err.message });
    return;
  }
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ code: 500, message: 'Internal Server Error' });
}

export function ok<T>(res: Response, data: T, message = 'ok'): void {
  res.json({ code: 0, data, message });
}
