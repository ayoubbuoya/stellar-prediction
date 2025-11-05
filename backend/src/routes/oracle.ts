import { Router } from 'express';
import { getOraclePrice } from '../controllers/roundsController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Oracle
 *   description: Oracle price feed endpoints
 */

router.get('/price', getOraclePrice);

export default router;
