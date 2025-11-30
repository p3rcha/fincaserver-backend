import { Router } from 'express';
import { serverInfo } from '../data/serverInfo';

const router = Router();

router.get('/server-info', (req, res) => {
  res.json(serverInfo);
});

export default router;

