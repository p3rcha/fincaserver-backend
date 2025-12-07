/**
 * Express Type Utilities
 * 
 * Custom type definitions for Express route handlers with proper typing.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type qs from 'qs';

/**
 * Async route handler type
 * Wraps async functions to properly handle Promise rejections
 */
export type AsyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string | undefined>
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

/**
 * Typed request with params
 */
export type TypedRequest<
  P = Record<string, string>,
  ReqBody = unknown,
  ReqQuery = Record<string, string | undefined>
> = Request<P, unknown, ReqBody, ReqQuery>;

/**
 * Typed response
 */
export type TypedResponse<ResBody = unknown> = Response<ResBody>;

/**
 * Route params for basket routes
 */
export interface BasketParams {
  basketIdent: string;
}

/**
 * Route params for package routes
 */
export interface PackageParams {
  packageId: string;
}

/**
 * Route params for category routes
 */
export interface CategoryParams {
  categoryId: string;
}

/**
 * Combined basket and package params
 */
export interface BasketPackageParams extends BasketParams {
  packageId: string;
}

/**
 * Query params for package listing
 */
export interface PackageQuery {
  basketIdent?: string;
  ipAddress?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * Helper to wrap async handlers and catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = <
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = qs.ParsedQs
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<void>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

