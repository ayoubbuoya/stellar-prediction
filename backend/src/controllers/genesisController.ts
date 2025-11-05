import { Request, Response } from 'express';
import { PredictionMarketService } from '../services/predictionMarketService.js';

const service = new PredictionMarketService();

/**
 * @swagger
 * /api/genesis/start:
 *   post:
 *     summary: Start the genesis round
 *     description: Initiates the first prediction round. Only callable by the contract owner.
 *     tags: [Genesis]
 *     responses:
 *       200:
 *         description: Genesis round started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenesisStartResponse'
 *       400:
 *         description: Genesis already started or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const genesisStart = async (req: Request, res: Response) => {
  try {
    // Check if genesis already started
    const isStarted = await service.getIsGenesisStarted();
    
    if (isStarted) {
      return res.status(400).json({
        success: false,
        error: 'Genesis round has already been started',
      });
    }

    const result = await service.genesisStartRound();

    return res.status(200).json({
      success: true,
      message: 'Genesis round started successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error starting genesis round:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start genesis round',
    });
  }
};

/**
 * @swagger
 * /api/genesis/lock:
 *   post:
 *     summary: Lock the genesis round
 *     description: Locks the genesis round and starts the next round. Only callable by the contract owner.
 *     tags: [Genesis]
 *     responses:
 *       200:
 *         description: Genesis round locked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenesisLockResponse'
 *       400:
 *         description: Genesis not started or already locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const genesisLock = async (req: Request, res: Response) => {
  try {
    // Check if genesis is already locked
    const isLocked = await service.getIsGenesisLocked();
    
    if (isLocked) {
      return res.status(400).json({
        success: false,
        error: 'Genesis round has already been locked',
      });
    }

    // Check if genesis started
    const isStarted = await service.getIsGenesisStarted();
    
    if (!isStarted) {
      return res.status(400).json({
        success: false,
        error: 'Genesis round has not been started yet',
      });
    }

    const result = await service.genesisLockRound();

    return res.status(200).json({
      success: true,
      message: 'Genesis round locked successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error locking genesis round:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to lock genesis round',
    });
  }
};

/**
 * @swagger
 * /api/genesis/status:
 *   get:
 *     summary: Get genesis status
 *     description: Returns the current status of genesis rounds
 *     tags: [Genesis]
 *     responses:
 *       200:
 *         description: Genesis status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isGenesisStarted:
 *                       type: boolean
 *                       example: true
 *                     isGenesisLocked:
 *                       type: boolean
 *                       example: false
 *                     currentEpoch:
 *                       type: string
 *                       example: "1"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getGenesisStatus = async (req: Request, res: Response) => {
  try {
    const isStarted = await service.getIsGenesisStarted();
    const isLocked = await service.getIsGenesisLocked();
    const currentEpoch = await service.getCurrentEpoch();

    return res.status(200).json({
      success: true,
      data: {
        isGenesisStarted: isStarted,
        isGenesisLocked: isLocked,
        currentEpoch: currentEpoch.toString(),
      },
    });
  } catch (error) {
    console.error('Error getting genesis status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get genesis status',
    });
  }
};
