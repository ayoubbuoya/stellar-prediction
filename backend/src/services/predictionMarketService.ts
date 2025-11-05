import { Client as PredictionMarketClient } from "prediction-market";
import { getStellarConfig, getRpcServer } from "../config/stellar.js";
import { submitAndWaitForTransaction } from "../utils.ts";

interface TransactionResult {
  transactionHash: string;
  epoch: string;
}

interface RoundInfo {
  epoch: bigint;
  start_timestamp: bigint;
  lock_timestamp: bigint;
  close_timestamp: bigint;
  lock_price: bigint;
  close_price: bigint;
  total_amount: bigint;
  bull_amount: bigint;
  bear_amount: bigint;
  reward_amount: bigint;
  reward_base_cal_amount: bigint;
}

export class PredictionMarketService {
  private client: PredictionMarketClient;
  private config: ReturnType<typeof getStellarConfig>;
  private rpcServer: ReturnType<typeof getRpcServer>;

  constructor() {
    this.config = getStellarConfig();
    this.rpcServer = getRpcServer();

    this.client = new PredictionMarketClient({
      contractId: this.config.contractId,
      networkPassphrase: this.config.networkPassphrase,
      rpcUrl: this.config.rpcUrl,
      publicKey: this.config.ownerKeypair.publicKey(),
    });
  }

  async genesisStartRound(): Promise<TransactionResult> {
    try {
      const tx = await this.client.genesis_start_round();

      const result = await submitAndWaitForTransaction(
        tx.toXDR(),
        this.rpcServer,
        this.config
      );

      const currentEpoch = await this.getCurrentEpoch();

      return {
        transactionHash: result.hash,
        epoch: currentEpoch.toString(),
      };
    } catch (error) {
      console.error("Error in genesisStartRound:", error);
      throw error;
    }
  }

  async genesisLockRound(): Promise<TransactionResult> {
    try {
      const tx = await this.client.genesis_lock_round();

      const result = await submitAndWaitForTransaction(
        tx.toXDR(),
        this.rpcServer,
        this.config
      );

      const currentEpoch = await this.getCurrentEpoch();

      return {
        transactionHash: result.hash,
        epoch: currentEpoch.toString(),
      };
    } catch (error) {
      console.error("Error in genesisLockRound:", error);
      throw error;
    }
  }

  async executeRound(): Promise<TransactionResult> {
    try {
      const tx = await this.client.execute_round();

      const result = await submitAndWaitForTransaction(
        tx.toXDR(),
        this.rpcServer,
        this.config
      );

      const currentEpoch = await this.getCurrentEpoch();

      return {
        transactionHash: result.hash,
        epoch: currentEpoch.toString(),
      };
    } catch (error) {
      console.error("Error in executeRound:", error);
      throw error;
    }
  }

  async getIsGenesisStarted(): Promise<boolean> {
    try {
      const result = await this.client.get_is_genesis_started();
      return Boolean(result.result);
    } catch (error) {
      console.error("Error in getIsGenesisStarted:", error);
      throw error;
    }
  }

  async getIsGenesisLocked(): Promise<boolean> {
    try {
      const result = await this.client.get_is_genesis_locked();
      return Boolean(result.result);
    } catch (error) {
      console.error("Error in getIsGenesisLocked:", error);
      throw error;
    }
  }

  async getCurrentEpoch(): Promise<bigint> {
    try {
      const result = await this.client.get_current_epoch();
      return BigInt(result.result?.toString() || "0");
    } catch (error) {
      console.error("Error in getCurrentEpoch:", error);
      throw error;
    }
  }

  async getRound(epoch: bigint): Promise<RoundInfo> {
    try {
      const result = await this.client.get_round({ epoch });
      const round = result.result;

      if (!round) {
        throw new Error("Round not found");
      }

      return {
        epoch: BigInt(round.epoch?.toString() || "0"),
        start_timestamp: BigInt(round.start_timestamp?.toString() || "0"),
        lock_timestamp: BigInt(round.lock_timestamp?.toString() || "0"),
        close_timestamp: BigInt(round.close_timestamp?.toString() || "0"),
        lock_price: BigInt(round.lock_price?.toString() || "0"),
        close_price: BigInt(round.close_price?.toString() || "0"),
        total_amount: BigInt(round.total_amount?.toString() || "0"),
        bull_amount: BigInt(round.bull_amount?.toString() || "0"),
        bear_amount: BigInt(round.bear_amount?.toString() || "0"),
        reward_amount: BigInt(round.reward_amount?.toString() || "0"),
        reward_base_cal_amount: BigInt(
          round.reward_base_cal_amount?.toString() || "0"
        ),
      };
    } catch (error) {
      console.error("Error in getRound:", error);
      throw error;
    }
  }

  async getXlmOraclePrice(): Promise<bigint> {
    try {
      const result = await this.client.get_xlm_oracle_price();
      return BigInt(result.result?.toString() || "0");
    } catch (error) {
      console.error("Error in getXlmOraclePrice:", error);
      throw error;
    }
  }

  async getIntervalSeconds(): Promise<bigint> {
    try {
      const result = await this.client.get_interval_seconds();
      return BigInt(result.result?.toString() || "0");
    } catch (error) {
      console.error("Error in getIntervalSeconds:", error);
      throw error;
    }
  }
}
