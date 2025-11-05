import { Request, Response } from 'express';
import { getCronService } from '../services/cronService.js';

const cronService = getCronService();

/**
 * @swagger
 * /api/cron/start:
 *   post:
 *     summary: Start the cron job for automatic round execution
 *     description: Starts a cron job that automatically executes rounds periodically based on the contract's intervalSeconds. Only works if genesis is started and locked.
 *     tags: [Cron]
 *     responses:
 *       200:
 *         description: Cron job started successfully
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
 *                   example: "Cron job started successfully. Executing rounds every 300 seconds"
 *       400:
 *         description: Cannot start cron job (already running or genesis not ready)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cannot start cron job: Genesis must be started and locked first"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const startCron = async (req: Request, res: Response) => {
  try {
    const result = await cronService.start();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error starting cron job:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start cron job',
    });
  }
};

/**
 * @swagger
 * /api/cron/pause:
 *   post:
 *     summary: Pause the cron job
 *     description: Stops the automatic execution of rounds. The cron job can be restarted later.
 *     tags: [Cron]
 *     responses:
 *       200:
 *         description: Cron job paused successfully
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
 *                   example: "Cron job paused successfully"
 *       400:
 *         description: Cron job is not running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cron job is not running"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const pauseCron = async (req: Request, res: Response) => {
  try {
    const result = cronService.pause();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error pausing cron job:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause cron job',
    });
  }
};

/**
 * @swagger
 * /api/cron/status:
 *   get:
 *     summary: Get cron job status
 *     description: Returns the current status of the cron job including whether it's running and the interval.
 *     tags: [Cron]
 *     responses:
 *       200:
 *         description: Cron job status retrieved successfully
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
 *                     isRunning:
 *                       type: boolean
 *                       example: true
 *                     intervalSeconds:
 *                       type: number
 *                       example: 300
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getCronStatus = async (req: Request, res: Response) => {
  try {
    const status = cronService.getStatus();

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cron status',
    });
  }
};

