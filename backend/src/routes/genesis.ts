import { Router } from 'express';
import { genesisStart, genesisLock, getGenesisStatus } from '../controllers/genesisController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Genesis
 *   description: Genesis round management endpoints
 */

router.post('/start', genesisStart);
router.post('/lock', genesisLock);
router.get('/status', getGenesisStatus);

export default router;
