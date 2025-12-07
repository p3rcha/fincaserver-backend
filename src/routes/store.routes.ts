import { Router } from 'express';
import type { Request, Response } from 'express';
import { storeItems } from '../data/storeItems.js';
import type { StoreItem } from '../types/StoreItem.js';

const router = Router();

/**
 * @openapi
 * /api/store/items:
 *   get:
 *     tags: [Store]
 *     summary: Get store items
 *     description: Retrieve all available items from the local store (mock data). For real store products, use the Tebex endpoints.
 *     responses:
 *       200:
 *         description: List of store items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StoreItem'
 *             example:
 *               - id: 1
 *                 name: VIP Rank
 *                 price: 9.99
 *                 description: Get VIP perks on the server
 *               - id: 2
 *                 name: MVP Rank
 *                 price: 19.99
 *                 description: Premium MVP benefits
 */
router.get('/items', (req: Request, res: Response<StoreItem[]>) => {
  res.json(storeItems);
});

export default router;
