import { AppError } from './AppError';
import { ErrorCodes, ErrorCode } from './error-codes';

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: ErrorCode = ErrorCodes.RESOURCE_NOT_FOUND, details?: any) {
    super(message, 404, code, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code: ErrorCode = ErrorCodes.VALIDATION_ERROR, details?: any) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: ErrorCode = ErrorCodes.UNAUTHORIZED, details?: any) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: ErrorCode = ErrorCodes.FORBIDDEN, details?: any) {
    super(message, 403, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', code: ErrorCode = ErrorCodes.ALREADY_EXISTS, details?: any) {
    super(message, 409, code, details);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', code: ErrorCode = ErrorCodes.INTERNAL_ERROR, details?: any) {
    super(message, 500, code, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', code: ErrorCode = ErrorCodes.EXTERNAL_SERVICE_ERROR, details?: any) {
    super(message, 502, code, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', code: ErrorCode = ErrorCodes.TOO_MANY_REQUESTS, details?: any) {
    super(message, 429, code, details);
  }
}
