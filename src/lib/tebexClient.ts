import axios from 'axios';

/**
 * Tebex Headless API Client
 * 
 * Cliente axios centralizado para todas las llamadas a la API de Tebex.
 * Maneja automáticamente los headers, errores, y logging.
 */

const TEBEX_API_BASE = 'https://headless.tebex.io/api';

// Get the public token from environment
const getPublicToken = (): string => {
  const token = process.env.TEBEX_PUBLIC_KEY;
  if (!token) {
    throw new Error('TEBEX_PUBLIC_KEY not configured');
  }
  return token;
};

// Create axios instance with base configuration
const tebexClient = axios.create({
  baseURL: TEBEX_API_BASE,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Response interceptor for error logging
tebexClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error('Tebex API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to build account-prefixed URLs
 * Most Tebex endpoints require /accounts/{token}/ prefix
 */
export const getAccountUrl = (path: string): string => {
  const token = getPublicToken();
  return `/accounts/${token}${path}`;
};

/**
 * Helper to build basket URLs (no account prefix needed)
 */
export const getBasketUrl = (basketIdent: string, path = ''): string => {
  return `/baskets/${basketIdent}${path}`;
};

export { getPublicToken };
export default tebexClient;

