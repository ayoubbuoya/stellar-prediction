import { Request, Response } from 'express';
import { PredictionMarketService } from '../services/predictionMarketService.js';

const service = new PredictionMarketService();

/**
 * @swagger
 * /api/rounds/execute:
 *   post:
 *     summary: Execute a round
 *     description: Locks the current round, ends the previous round, and calculates rewards. Only callable by the contract owner.
 *     tags: [Rounds]
 *     responses:
 *       200:
 *         description: Round executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Round executed successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionHash:
 *                       type: string
 *                     epoch:
 *                       type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const executeRound = async (req: Request, res: Response) => {
  try {
    const result = await service.executeRound();

    return res.status(200).json({
      success: true,
      message: 'Round executed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error executing round:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute round',
    });
  }
};

/**
 * @swagger
 * /api/rounds/{epoch}:
 *   get:
 *     summary: Get round information
 *     description: Returns information about a specific round
 *     tags: [Rounds]
 *     parameters:
 *       - in: path
 *         name: epoch
 *         required: true
 *         schema:
 *           type: string
 *         description: The epoch number of the round
 *     responses:
 *       200:
 *         description: Round information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RoundInfo'
 *       400:
 *         description: Invalid epoch parameter
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
export const getRound = async (req: Request, res: Response) => {
  try {
    const { epoch } = req.params;
    
    if (!epoch) {
      return res.status(400).json({
        success: false,
        error: 'Epoch parameter is required',
      });
    }

    const epochBigInt = BigInt(epoch);
    const round = await service.getRound(epochBigInt);

    return res.status(200).json({
      success: true,
      data: {
        epoch: round.epoch.toString(),
        startTimestamp: round.start_timestamp.toString(),
        lockTimestamp: round.lock_timestamp.toString(),
        closeTimestamp: round.close_timestamp.toString(),
        lockPrice: round.lock_price.toString(),
        closePrice: round.close_price.toString(),
        totalAmount: round.total_amount.toString(),
        bullAmount: round.bull_amount.toString(),
        bearAmount: round.bear_amount.toString(),
        rewardAmount: round.reward_amount.toString(),
        rewardBaseCalAmount: round.reward_base_cal_amount.toString(),
      },
    });
  } catch (error) {
    console.error('Error getting round:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get round information',
    });
  }
};

/**
 * @swagger
 * /api/rounds/current:
 *   get:
 *     summary: Get current epoch
 *     description: Returns the current epoch number
 *     tags: [Rounds]
 *     responses:
 *       200:
 *         description: Current epoch retrieved successfully
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
 *                     currentEpoch:
 *                       type: string
 *                       example: "5"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getCurrentEpoch = async (req: Request, res: Response) => {
  try {
    const currentEpoch = await service.getCurrentEpoch();

    return res.status(200).json({
      success: true,
      data: {
        currentEpoch: currentEpoch.toString(),
      },
    });
  } catch (error) {
    console.error('Error getting current epoch:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current epoch',
    });
  }
};

/**
 * @swagger
 * /api/oracle/price:
 *   get:
 *     summary: Get XLM oracle price
 *     description: Returns the current XLM price from the oracle
 *     tags: [Oracle]
 *     responses:
 *       200:
 *         description: XLM price retrieved successfully
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
 *                     price:
 *                       type: string
 *                       example: "1000000"
 *                     timestamp:
 *                       type: string
 *                       example: "1699999999"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getOraclePrice = async (req: Request, res: Response) => {
  try {
    const price = await service.getXlmOraclePrice();

    return res.status(200).json({
      success: true,
      data: {
        price: price.toString(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting oracle price:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get oracle price',
    });
  }
};
