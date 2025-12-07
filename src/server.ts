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

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
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
