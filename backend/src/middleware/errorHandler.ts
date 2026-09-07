import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { AppError, ErrorCodes, type ErrorCode, type ErrorDetail } from '../utils/errors';

interface SerializedError {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
}

/** Map a duplicate-key (11000) error to a friendly, resource-specific code. */
function mapDuplicateKey(err: mongoose.mongo.MongoServerError): SerializedError {
  const fields = Object.keys(err.keyPattern ?? {});
  if (fields.includes('email')) {
    return { statusCode: 409, code: ErrorCodes.EMAIL_TAKEN, message: 'This email is already registered.' };
  }
  if (fields.includes('booking')) {
    return { statusCode: 409, code: ErrorCodes.REVIEW_DUPLICATE, message: 'You have already reviewed this booking.' };
  }
  if (fields.includes('customer') && fields.includes('property')) {
    return { statusCode: 409, code: ErrorCodes.WISHLIST_DUPLICATE, message: 'Property is already in your wishlist.' };
  }
  return { statusCode: 409, code: ErrorCodes.CONFLICT, message: 'Duplicate value violates a unique constraint.' };
}

function serialize(err: unknown): SerializedError {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      statusCode: 422,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed.',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 422,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed.',
      details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, code: ErrorCodes.VALIDATION_ERROR, message: `Invalid value for '${err.path}'.` };
  }
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    return mapDuplicateKey(err);
  }
  if (err instanceof jwt.TokenExpiredError) {
    return { statusCode: 401, code: ErrorCodes.TOKEN_EXPIRED, message: 'Access token expired.' };
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return { statusCode: 401, code: ErrorCodes.TOKEN_INVALID, message: 'Invalid access token.' };
  }
  // body-parser (express.json) errors carry a `type` discriminator.
  if (err && typeof err === 'object' && 'type' in err) {
    const t = (err as { type?: string }).type;
    if (t === 'entity.too.large') {
      return { statusCode: 413, code: ErrorCodes.PAYLOAD_TOO_LARGE, message: 'Request payload is too large.' };
    }
    if (t === 'entity.parse.failed' || t === 'charset.unsupported' || t === 'encoding.unsupported') {
      return { statusCode: 400, code: ErrorCodes.VALIDATION_ERROR, message: 'Malformed request body.' };
    }
  }
  const fallbackMessage =
    (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && err instanceof Error
      ? err.message
      : 'Something went wrong.';
  return { statusCode: 500, code: ErrorCodes.INTERNAL, message: fallbackMessage };
}

/**
 * Centralized error handler. Produces the consistent error envelope, logs with the
 * request id, and never leaks stack traces or internal messages in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const { statusCode, code, message, details } = serialize(err);

  const logPayload = { err, code, statusCode, requestId: req.id, method: req.method, url: req.originalUrl };
  if (statusCode >= 500) logger.error(logPayload, 'Unhandled error');
  else logger.warn(logPayload, 'Request error');

  const safeMessage = statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong.' : message;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: safeMessage,
      ...(details && details.length ? { details } : {}),
      requestId: req.id,
    },
  });
}
