/**
 * Error Handler Utilities
 * 
 * Type-safe error handling for API routes and external service calls.
 */

import { AxiosError } from 'axios';
import type { Response } from 'express';
import type { ApiErrorResponse } from '../types/express.js';

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Check if error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}

/**
 * Extract API error message from Axios error response
 */
export function getAxiosErrorMessage(error: AxiosError, defaultMessage: string): string {
  const responseData = error.response?.data as Record<string, unknown> | undefined;
  
  if (responseData?.message && typeof responseData.message === 'string') {
    return responseData.message;
  }
  
  if (responseData?.error && typeof responseData.error === 'string') {
    return responseData.error;
  }
  
  return defaultMessage;
}

/**
 * Handle API errors and send appropriate response
 */
export function handleApiError(
  res: Response<ApiErrorResponse>,
  error: unknown,
  defaultMessage: string,
  statusCode = 500
): void {
  console.error(`[API Error] ${defaultMessage}:`, error);

  if (isAxiosError(error)) {
    const message = getAxiosErrorMessage(error, defaultMessage);
    const status = error.response?.status ?? statusCode;
    
    res.status(status).json({
      error: message,
      message: defaultMessage,
    });
    return;
  }

  res.status(statusCode).json({
    error: getErrorMessage(error),
    message: defaultMessage,
  });
}

/**
 * Create a typed error response
 */
export function createErrorResponse(
  error: string,
  message?: string,
  details?: unknown
): ApiErrorResponse {
  const response: ApiErrorResponse = { error };
  if (message !== undefined) {
    response.message = message;
  }
  if (details !== undefined) {
    response.details = details;
  }
  return response;
}

/**
 * Tebex-specific error handler
 */
export function handleTebexError(
  res: Response<ApiErrorResponse>,
  error: unknown,
  operation: string
): void {
  const defaultMessage = `Failed to ${operation}`;
  
  if (isAxiosError(error)) {
    const status = error.response?.status;
    
    // Handle specific Tebex error codes
    switch (status) {
      case 400:
        handleApiError(res, error, `Invalid request: ${operation}`, 400);
        break;
      case 401:
        handleApiError(res, error, 'Tebex authentication failed', 401);
        break;
      case 403:
        handleApiError(res, error, 'Tebex access denied', 403);
        break;
      case 404:
        handleApiError(res, error, `Resource not found: ${operation}`, 404);
        break;
      case 422:
        handleApiError(res, error, `Validation error: ${operation}`, 422);
        break;
      case 429:
        handleApiError(res, error, 'Tebex rate limit exceeded', 429);
        break;
      default:
        handleApiError(res, error, defaultMessage, status ?? 500);
    }
    return;
  }
  
  handleApiError(res, error, defaultMessage);
}

