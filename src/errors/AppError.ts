import { ErrorCode } from './error-codes';

export class AppError extends Error {
  public readonly status: number;
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.status = statusCode;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
