export class ServiceError extends Error {
  constructor(public code: string, public status: number, message: string, public retryAfter?: number) {
    super(message);
  }
}
export function safeError(error: unknown): ServiceError {
  return error instanceof ServiceError ? error : new ServiceError('INTERNAL_ERROR', 500, 'The scan could not be completed. Please try again later.');
}
