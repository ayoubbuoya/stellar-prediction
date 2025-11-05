import { Router } from 'express';
import { startCron, pauseCron, getCronStatus } from '../controllers/cronController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cron
 *   description: Cron job management for automatic round execution
 */

router.post('/start', startCron);
router.post('/pause', pauseCron);
router.get('/status', getCronStatus);

export default router;

