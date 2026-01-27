import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';
import swaggerSpec from './config/swagger.js';
import { scalarConfig } from './config/scalarTheme.js';
import serverInfoRoutes from './routes/serverInfo.routes.js';
import storeRoutes from './routes/store.routes.js';
import tebexRoutes from './routes/tebex.routes.js';
import eleccionesRoutes from './routes/elecciones.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// CORS Configuration
// ============================================
// Allow requests from frontend domain(s)
const FRONTEND_URL = process.env.FRONTEND_URL;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// Build allowed origins list
const allowedOrigins = [
  // Development origins (always allowed)
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000',  // Alternative dev port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  // Production origins from environment
  ...(FRONTEND_URL ? [FRONTEND_URL] : []),
  ...ALLOWED_ORIGINS,
];

// CORS middleware with origin validation
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(allowed => {
        // Exact match
        if (origin === allowed) return true;
        // Starts with match (for localhost with ports)
        if (origin.startsWith(allowed)) return true;
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        console.warn(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// ============================================
// API Documentation (Scalar)
// ============================================

/**
 * Serve OpenAPI specification as JSON
 * Useful for external tools and debugging
 */
app.get('/api/docs/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * Scalar API Reference UI
 * Modern, beautiful API documentation
 */
app.use(
  '/api/docs',
  apiReference({
    spec: { content: swaggerSpec },
    ...scalarConfig,
  } as Parameters<typeof apiReference>[0])
);

// ============================================
// Routes
// ============================================

app.use('/api', serverInfoRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/tebex', tebexRoutes);
app.use('/api/elecciones', eleccionesRoutes);

// ============================================
// Health Check
// ============================================

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Simple endpoint to verify the API server is running.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
interface HealthResponse {
  status: 'ok';
}

app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({ status: 'ok' });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`>>> Server running on port ${PORT}`);
  console.log(`>>> API Docs available at http://localhost:${PORT}/api/docs`);
  console.log(`>>> OpenAPI spec at http://localhost:${PORT}/api/docs/openapi.json`);
});
