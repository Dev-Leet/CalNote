export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_OWNER'
  | 'NOT_FOUND'
  | 'CONFLICT_DETECTED'
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_GOOGLE_TOKEN'
  | 'REFRESH_TOKEN_INVALID_OR_REVOKED'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'AI_PROVIDER_ERROR';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: AppErrorCode, statusCode: number, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
