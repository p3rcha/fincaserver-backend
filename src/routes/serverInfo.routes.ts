import { Router } from 'express';
import type { Request, Response } from 'express';
import { serverInfo } from '../data/serverInfo.js';
import type { ServerInfo } from '../types/ServerInfo.js';

const router = Router();

/**
 * @openapi
 * /api/server-info:
 *   get:
 *     tags: [Server Info]
 *     summary: Get server information
 *     description: Retrieve current Minecraft server information including name, IP, version, and player counts.
 *     responses:
 *       200:
 *         description: Server information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerInfo'
 *             example:
 *               name: FINCA SERVER
 *               ip: mc.fincaserver.net
 *               version: "1.21"
 *               maxPlayers: 100
 *               onlinePlayers: 42
 */
router.get('/server-info', (req: Request, res: Response<ServerInfo>) => {
  res.json(serverInfo);
});

export default router;
