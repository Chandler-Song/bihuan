export class HttpError extends Error {
  status: number;
  code: number;
  constructor(status: number, message: string, code = -1) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const Errors = {
  badRequest: (msg = 'Bad Request'): HttpError => new HttpError(400, msg, 400),
  unauthorized: (msg = 'Unauthorized'): HttpError => new HttpError(401, msg, 401),
  forbidden: (msg = 'Forbidden'): HttpError => new HttpError(403, msg, 403),
  notFound: (msg = 'Not Found'): HttpError => new HttpError(404, msg, 404),
  conflict: (msg = 'Conflict'): HttpError => new HttpError(409, msg, 409),
  tooMany: (msg = 'Too Many Requests'): HttpError => new HttpError(429, msg, 429),
  internal: (msg = 'Internal Server Error'): HttpError => new HttpError(500, msg, 500),
};
