import type { Request } from 'express';

/**
 * Extract IP address from request
 * Handles proxies and load balancers (X-Forwarded-For header)
 */
export const getClientIp = (req: Request): string => {
  // Check X-Forwarded-For header (from proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    if (typeof forwardedFor === 'string') {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const firstIp = forwardedFor.split(',')[0]?.trim();
      if (firstIp) {
        return firstIp;
      }
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      const firstIp = forwardedFor[0];
      if (typeof firstIp === 'string') {
        const trimmedIp = firstIp.split(',')[0]?.trim();
        if (trimmedIp) {
          return trimmedIp;
        }
      }
    }
  }

  // Check X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  // Fallback to connection remote address
  return req.socket?.remoteAddress || req.ip || 'unknown';
};

/**
 * Extract user agent from request
 */
export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};
