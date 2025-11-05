import { Router } from 'express';
import { executeRound, getRound, getCurrentEpoch } from '../controllers/roundsController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rounds
 *   description: Prediction round management endpoints
 */

router.post('/execute', executeRound);
router.get('/current', getCurrentEpoch);
router.get('/:epoch', getRound);

export default router;
