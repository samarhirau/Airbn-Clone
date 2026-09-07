// 

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  BOOKING_INVALID: 'BOOKING_INVALID',
  REVIEW_NOT_ELIGIBLE: 'REVIEW_NOT_ELIGIBLE',
  REVIEW_DUPLICATE: 'REVIEW_DUPLICATE',
  WISHLIST_DUPLICATE: 'WISHLIST_DUPLICATE',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, code: ErrorCode = ErrorCodes.VALIDATION_ERROR, details?: ErrorDetail[]) {
    return new AppError(400, code, message, details);
  }
  static unauthorized(message = 'Authentication required', code: ErrorCode = ErrorCodes.UNAUTHENTICATED) {
    return new AppError(401, code, message);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(403, ErrorCodes.FORBIDDEN, message);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(404, ErrorCodes.NOT_FOUND, message);
  }
  static conflict(message: string, code: ErrorCode = ErrorCodes.CONFLICT) {
    return new AppError(409, code, message);
  }
  static unprocessable(message: string, details?: ErrorDetail[]) {
    return new AppError(422, ErrorCodes.VALIDATION_ERROR, message, details);
  }
  static internal(message = 'Something went wrong') {
    return new AppError(500, ErrorCodes.INTERNAL, message);
  }
}
