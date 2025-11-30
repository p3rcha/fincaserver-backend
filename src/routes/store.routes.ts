import { Router } from 'express';
import { storeItems } from '../data/storeItems';

const router = Router();

router.get('/items', (req, res) => {
  res.json(storeItems);
});

export default router;

