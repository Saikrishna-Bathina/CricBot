import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Safe client error message
  const clientResponse = {
    success: false,
    error: {
      message: err.isOperational || statusCode < 500 ? err.message : 'An unexpected internal server error occurred',
      code: err.code || 'INTERNAL_ERROR',
      ...(err.details && { details: err.details })
    }
  };

  // Log error details on server
  console.error(`[Error] [${req.method} ${req.originalUrl}]:`, {
    status: statusCode,
    message: err.message,
    stack: env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  if (env.NODE_ENV !== 'production' && statusCode === 500) {
    clientResponse.error.debug = err.message;
    clientResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(clientResponse);
}

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
