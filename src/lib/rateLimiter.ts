import { supabase } from './supabase.js';

/**
 * Rate Limiter
 * 
 * Implements rate limiting for elecciones form submissions:
 * - Max 1 submission per Minecraft username
 * - Max submissions per IP address
 * - Max submissions per device fingerprint
 * - Time-based restrictions
 */

const MAX_SUBMISSIONS_PER_MC_NAME = parseInt(process.env.MAX_SUBMISSIONS_PER_MC_NAME || '1', 10);
const MAX_SUBMISSIONS_PER_IP = parseInt(process.env.MAX_SUBMISSIONS_PER_IP || '3', 10);
const MAX_SUBMISSIONS_PER_DEVICE = parseInt(process.env.MAX_SUBMISSIONS_PER_DEVICE || '2', 10);
const RATE_LIMIT_WINDOW_HOURS = parseInt(process.env.RATE_LIMIT_WINDOW_HOURS || '24', 10);

/**
 * Check if MC username has already submitted
 */
export const hasAlreadySubmitted = async (mcName: string): Promise<boolean> => {
  if (!mcName || !mcName.trim()) {
    return false;
  }

  const normalizedName = mcName.trim();

  try {
    // Use case-insensitive comparison
    const { data, error } = await supabase
      .from('elecciones')
      .select('id')
      .ilike('mc_name', normalizedName)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No submission found
        return false;
      }
      console.error('Error checking existing submission:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception checking existing submission:', error);
    return false;
  }
};

/**
 * Count submissions from IP address within time window
 */
export const countIpSubmissions = async (ipAddress: string, hours: number = RATE_LIMIT_WINDOW_HOURS): Promise<number> => {
  if (!ipAddress || ipAddress === 'unknown') {
    return 0;
  }

  const timeWindow = new Date();
  timeWindow.setHours(timeWindow.getHours() - hours);

  try {
    const { count, error } = await supabase
      .from('elecciones_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gte('submitted_at', timeWindow.toISOString());

    if (error) {
      console.error('Error counting IP submissions:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Exception counting IP submissions:', error);
    return 0;
  }
};

/**
 * Count submissions from device fingerprint within time window
 */
export const countDeviceSubmissions = async (
  deviceFingerprint: string,
  hours: number = RATE_LIMIT_WINDOW_HOURS
): Promise<number> => {
  if (!deviceFingerprint) {
    return 0;
  }

  const timeWindow = new Date();
  timeWindow.setHours(timeWindow.getHours() - hours);

  try {
    const { count, error } = await supabase
      .from('elecciones_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('device_fingerprint', deviceFingerprint)
      .gte('submitted_at', timeWindow.toISOString());

    if (error) {
      console.error('Error counting device submissions:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Exception counting device submissions:', error);
    return 0;
  }
};

/**
 * Record a submission attempt in the tracking table
 */
export const recordSubmissionAttempt = async (
  mcName: string,
  ipAddress: string,
  deviceFingerprint: string,
  userAgent: string,
  eleccionId?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('elecciones_submissions')
      .insert({
        mc_name: mcName.trim(),
        ip_address: ipAddress,
        device_fingerprint: deviceFingerprint,
        user_agent: userAgent,
        eleccion_id: eleccionId || null,
        status: eleccionId ? 'success' : 'failed',
      });

    if (error) {
      console.error('Error recording submission attempt:', error);
      // Don't throw - this is just for tracking
    }
  } catch (error) {
    console.error('Exception recording submission attempt:', error);
    // Don't throw - this is just for tracking
  }
};

/**
 * Check all rate limits and return error message if any limit is exceeded
 */
export const checkRateLimits = async (
  mcName: string,
  ipAddress: string,
  deviceFingerprint: string
): Promise<{ allowed: boolean; error?: string }> => {
  // Check if already submitted
  const alreadySubmitted = await hasAlreadySubmitted(mcName);
  if (alreadySubmitted) {
    return {
      allowed: false,
      error: 'Este nombre de Minecraft ya ha enviado una elección',
    };
  }

  // Check IP submissions
  const ipCount = await countIpSubmissions(ipAddress);
  if (ipCount >= MAX_SUBMISSIONS_PER_IP) {
    return {
      allowed: false,
      error: `Has alcanzado el límite de envíos desde esta dirección IP (máximo ${MAX_SUBMISSIONS_PER_IP} por ${RATE_LIMIT_WINDOW_HOURS} horas)`,
    };
  }

  // Check device submissions
  const deviceCount = await countDeviceSubmissions(deviceFingerprint);
  if (deviceCount >= MAX_SUBMISSIONS_PER_DEVICE) {
    return {
      allowed: false,
      error: `Has alcanzado el límite de envíos desde este dispositivo (máximo ${MAX_SUBMISSIONS_PER_DEVICE} por ${RATE_LIMIT_WINDOW_HOURS} horas)`,
    };
  }

  return { allowed: true };
};
