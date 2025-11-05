import { PredictionMarketService } from './predictionMarketService.js';

export class CronService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private predictionMarketService: PredictionMarketService;
  private intervalSeconds: number = 0;

  constructor() {
    this.predictionMarketService = new PredictionMarketService();
  }

  /**
   * Start the cron job to execute rounds periodically
   * Only starts if genesis is started and locked
   */
  async start(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if already running
      if (this.isRunning) {
        return {
          success: false,
          message: 'Cron job is already running',
        };
      }

      // Check if genesis is started and locked
      const isGenesisStarted = await this.predictionMarketService.getIsGenesisStarted();
      const isGenesisLocked = await this.predictionMarketService.getIsGenesisLocked();

      if (!isGenesisStarted || !isGenesisLocked) {
        return {
          success: false,
          message: 'Cannot start cron job: Genesis must be started and locked first',
        };
      }

      // Get interval seconds from the contract
      const intervalSecondsFromContract = await this.predictionMarketService.getIntervalSeconds();
      this.intervalSeconds = Number(intervalSecondsFromContract);

      // Convert seconds to milliseconds
      const intervalMs = this.intervalSeconds * 1000 + 5000; // Adding 5 seconds buffer

      console.log(`Starting cron job with interval: ${this.intervalSeconds} seconds (${intervalMs}ms)`);

      // Start the interval
      this.intervalId = setInterval(async () => {
        await this.executeRoundJob();
      }, intervalMs);

      this.isRunning = true;

      return {
        success: true,
        message: `Cron job started successfully. Executing rounds every ${this.intervalSeconds} seconds`,
      };
    } catch (error) {
      console.error('Error starting cron job:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start cron job',
      };
    }
  }

  /**
   * Pause/stop the cron job
   */
  pause(): { success: boolean; message: string } {
    if (!this.isRunning) {
      return {
        success: false,
        message: 'Cron job is not running',
      };
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;

    return {
      success: true,
      message: 'Cron job paused successfully',
    };
  }

  /**
   * Get the current status of the cron job
   */
  getStatus(): {
    isRunning: boolean;
    intervalSeconds: number;
  } {
    return {
      isRunning: this.isRunning,
      intervalSeconds: this.intervalSeconds,
    };
  }

  /**
   * Execute the round job
   * This is called periodically by the cron job
   */
  private async executeRoundJob(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Executing round...`);

      // Check if genesis is still started and locked
      const isGenesisStarted = await this.predictionMarketService.getIsGenesisStarted();
      const isGenesisLocked = await this.predictionMarketService.getIsGenesisLocked();

      if (!isGenesisStarted || !isGenesisLocked) {
        console.warn('Genesis is not started or locked. Pausing cron job.');
        this.pause();
        return;
      }

      // Execute the round
      const result = await this.predictionMarketService.executeRound();
      
      console.log(`[${new Date().toISOString()}] Round executed successfully:`, {
        transactionHash: result.transactionHash,
        epoch: result.epoch,
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error executing round:`, error);
      // Don't stop the cron job on error, just log it
      // The next execution will try again
    }
  }
}

// Singleton instance
let cronServiceInstance: CronService | null = null;

export function getCronService(): CronService {
  if (!cronServiceInstance) {
    cronServiceInstance = new CronService();
  }
  return cronServiceInstance;
}

