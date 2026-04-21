import { Elysia } from 'elysia';
import { AppError } from '../errors/AppError';
import {
  BadRequestError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../errors/error-classes';
import { ErrorCodes } from '../errors/error-codes';


export const errorHandler = new Elysia()
  .error({
    AppError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    InternalError,
    ExternalServiceError,
    TooManyRequestsError,
  })
  .derive(() => ({
    requestId: crypto.randomUUID()
  }))
  .onError(({ code, error, set, requestId }) => {
    console.error(`[${requestId}] Error:`, error);

// We use 'any' type assertions for the error object to bypass broad Elysia types
    const err = error as any;
    const isAppErrorLike =
      err &&
      typeof err === 'object' &&
      typeof err.statusCode === 'number' &&
      typeof err.code === 'string' &&
      typeof err.message === 'string';

    if (error instanceof AppError || isAppErrorLike) {
      set.status = err.statusCode;
      return {
        requestId,
        error: {
          code: err.code,
          message: err.message,
          details: err.details
        }
      };
    }

    if (code === 'VALIDATION') {
      const validationDetails =
        process.env.NODE_ENV === 'production'
          ? undefined
          : typeof err?.detail === 'function'
            ? err.detail(err.message)
            : err?.all;

      set.status = 400;
      return {
        requestId,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed', 
          details: validationDetails
        }
      };
    }

    // Checking for PrismaClientKnownRequestError pattern
    if (err?.code && typeof err.code === 'string' && err.code.startsWith('P')) {
      if (err.code === 'P2025') {
        set.status = 404;
        return {
          requestId,
          error: {
            code: ErrorCodes.RESOURCE_NOT_FOUND,
            message: 'Record not found',
            details: err.meta
          }
        };
      }
      
      if (err.code === 'P2002') {
        set.status = 409;
        return {
          requestId,
          error: {
            code: ErrorCodes.ALREADY_EXISTS,
            message: 'Unique constraint failed',
            details: err.meta
          }
        };
      }
    }

    set.status = 500;
    return {
      requestId,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    };
  });
