import type { Request, Response, NextFunction } from 'express';
import { isValidPlayer } from '../lib/playerValidator.js';
import { checkRateLimits } from '../lib/rateLimiter.js';
import { getClientIp, getUserAgent } from '../lib/deviceFingerprint.js';
import type { ApiErrorResponse } from '../types/express.js';

/**
 * Security Middleware for Elecciones Form
 * 
 * Validates:
 * 1. Player is in whitelist
 * 2. Rate limits (per MC name, per IP, per device)
 * 3. Extracts tracking information (IP, device fingerprint, user agent)
 */

interface EleccionesRequest extends Request {
  clientIp?: string;
  deviceFingerprint?: string;
  userAgent?: string;
}

export const eleccionesSecurityMiddleware = async (
  req: EleccionesRequest,
  res: Response<ApiErrorResponse | { error: string; discordUrl?: string; type?: string }>,
  next: NextFunction
): Promise<void> => {
  try {
    const { mcName } = req.body;
    const deviceFingerprint = (req.body.deviceFingerprint as string) || '';

    // Extract tracking information
    const clientIp = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Store in request for later use
    req.clientIp = clientIp;
    req.deviceFingerprint = deviceFingerprint;
    req.userAgent = userAgent;

    // Validate MC name is provided
    if (!mcName || !mcName.trim()) {
      res.status(400).json({
        error: 'El nombre de MC es requerido',
      });
      return;
    }

    // 1. Check if player is whitelisted
    const isWhitelisted = await isValidPlayer(mcName);
    if (!isWhitelisted) {
      const discordUrl = process.env.DISCORD_INVITE_URL || '';
      res.status(403).json({
        error: 'Usuario no se le ha permitido postularse, hable con un admin en discord',
        discordUrl,
        type: 'whitelist_error',
      });
      return;
    }

    // 2. Check rate limits
    const rateLimitCheck = await checkRateLimits(mcName, clientIp, deviceFingerprint);
    if (!rateLimitCheck.allowed) {
      res.status(429).json({
        error: rateLimitCheck.error || 'Límite de envíos alcanzado',
      });
      return;
    }

    // All checks passed, continue to next middleware/handler
    next();
  } catch (error) {
    console.error('Error in elecciones security middleware:', error);
    res.status(500).json({
      error: 'Error al validar la solicitud',
    });
  }
};
