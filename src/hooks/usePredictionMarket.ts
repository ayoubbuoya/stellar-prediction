import { useState, useEffect, useCallback } from "react";
import {
  Client as PredictionMarketClient,
  Round,
  BetInfo,
} from "prediction-market";

import { Client as TokenClient } from "xlm_asset";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Networks,
} from "@stellar/stellar-sdk";
import { Server as SorobanServer } from "@stellar/stellar-sdk/rpc";
import { useWallet } from "./useWallet";
import { submitAndWaitForTransaction } from "../util/contract";

const CONTRACT_ID = import.meta.env.PUBLIC_PREDICTION_MARKET_CONTRACT_ID || "";
const TOKEN_CONTRACT_ID =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
export const RPC_URL =
  import.meta.env.PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE =
  import.meta.env.PUBLIC_NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";

// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface LoadingStates {
  epoch: boolean;
  rounds: boolean;
  betting: boolean;
  oracle: boolean;
  userdata: boolean;
}

export const usePredictionMarket = () => {
  const { address, signTransaction } = useWallet();
  const [client, setClient] = useState<PredictionMarketClient | null>(null);
  const [tokenClient, setTokenClient] = useState<TokenClient | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<bigint | null>(null);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    epoch: false,
    rounds: false,
    betting: false,
    oracle: false,
    userdata: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stellarServer, setStellarServer] = useState<SorobanServer | null>(
    null
  );

  // Helper function to retry failed operations
  const retryOperation = async <T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES,
    delay = RETRY_DELAY
  ): Promise<T> => {
    try {
      return await operation();
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * 2); // Exponential backoff
      }
      throw err;
    }
  };

  // Initialize client
  useEffect(() => {
    const initClient = async () => {
      try {
        console.log("Initializing prediction market client...");
        console.log("Contract ID:", CONTRACT_ID);
        console.log("RPC URL:", RPC_URL);
        console.log("Network Passphrase:", NETWORK_PASSPHRASE);
        const predictionClient = new PredictionMarketClient({
          contractId: CONTRACT_ID,
          networkPassphrase: NETWORK_PASSPHRASE,
          rpcUrl: RPC_URL,
        });

        const tokenClient = new TokenClient({
          contractId: TOKEN_CONTRACT_ID,
          networkPassphrase: NETWORK_PASSPHRASE,
          rpcUrl: RPC_URL,
        });

        console.log("Clients initialized");
        setTokenClient(tokenClient);
        setClient(predictionClient);
        setStellarServer(new SorobanServer(RPC_URL));
        setError(null);
      } catch (err) {
        console.error("Failed to initialize prediction market client:", err);
        setError("Failed to initialize client");
      }
    };

    initClient();
  }, []);

  // Fetch current epoch
  const fetchCurrentEpoch = useCallback(async (): Promise<bigint | null> => {
    console.log("fetchCurrentEpoch");
    if (!client) return null;

    try {
      setLoadingStates((prev) => ({ ...prev, epoch: true }));
      const result = await retryOperation(() => client.get_current_epoch());
      const epoch = result.result;
      console.log("currentEpoch:", epoch);
      setCurrentEpoch(epoch);
      setError(null);
      return epoch;
    } catch (err) {
      console.error("Failed to fetch current epoch:", err);
      setError("Failed to fetch current epoch");
      return null;
    } finally {
      setLoadingStates((prev) => ({ ...prev, epoch: false }));
    }
  }, [client]);

  // Fetch round data
  const fetchRound = useCallback(
    async (epoch: bigint): Promise<Round | null> => {
      if (!client) return null;

      try {
        const result = await client.get_round({ epoch });
        setError(null);
        return result.result as Round;
      } catch (err: any) {
        // Check if it's a "round doesn't exist" error
        const errorMessage = err?.message || String(err);
        if (
          errorMessage.includes("UnreachableCodeReached") ||
          errorMessage.includes("InvalidAction") ||
          errorMessage.includes("simulation failed")
        ) {
          // Round doesn't exist yet - this is expected for future rounds
          return null;
        }

        console.error(`Failed to fetch round ${epoch}:`, err);
        return null;
      }
    },
    [client]
  );

  // Fetch multiple rounds in parallel
  const fetchMultipleRounds = useCallback(
    async (epochs: bigint[]): Promise<(Round | null)[]> => {
      if (!client) return [];

      try {
        setLoadingStates((prev) => ({ ...prev, rounds: true }));
        const promises = epochs.map((epoch) => fetchRound(epoch));
        const rounds = await Promise.all(promises);
        setError(null);
        return rounds;
      } catch (err) {
        console.error("Failed to fetch multiple rounds:", err);
        setError("Failed to fetch rounds");
        return [];
      } finally {
        setLoadingStates((prev) => ({ ...prev, rounds: false }));
      }
    },
    [client, fetchRound]
  );

  // Fetch current epoch and next N rounds
  const fetchCurrentAndNextRounds = useCallback(
    async (
      count: number = 3
    ): Promise<{ currentEpoch: bigint | null; rounds: (Round | null)[] }> => {
      if (!client) {
        return { currentEpoch: null, rounds: [] };
      }

      try {
        setLoadingStates((prev) => ({ ...prev, rounds: true }));

        // Fetch current epoch first
        const epoch = await fetchCurrentEpoch();

        if (!epoch) {
          return { currentEpoch: null, rounds: [] };
        }

        // Generate array of epoch numbers to fetch
        const epochsToFetch: bigint[] = [];
        for (let i = 0; i < count; i++) {
          epochsToFetch.push(epoch + BigInt(i));
        }

        // Fetch all rounds in parallel
        const rounds = await fetchMultipleRounds(epochsToFetch);

        return { currentEpoch: epoch, rounds };
      } catch (err) {
        console.error("Failed to fetch current and next rounds:", err);
        setError("Failed to fetch rounds");
        return { currentEpoch: null, rounds: [] };
      } finally {
        setLoadingStates((prev) => ({ ...prev, rounds: false }));
      }
    },
    [client, fetchCurrentEpoch, fetchMultipleRounds]
  );

  // Fetch user bet info
  const fetchBetInfo = useCallback(
    async (epoch: bigint, user: string): Promise<BetInfo | null> => {
      if (!client) return null;

      try {
        setLoadingStates((prev) => ({ ...prev, userdata: true }));
        const result = await retryOperation(() =>
          client.get_bet_info({ epoch, user })
        );
        setError(null);
        return result.result as BetInfo;
      } catch (err) {
        console.error(`Failed to fetch bet info for epoch ${epoch}:`, err);
        // Don't set global error for bet info failures (user might not have bet)
        return null;
      } finally {
        setLoadingStates((prev) => ({ ...prev, userdata: false }));
      }
    },
    [client]
  );

  // Fetch user rounds
  const fetchUserRounds = useCallback(
    async (user: string): Promise<bigint[] | null> => {
      if (!client) return null;

      try {
        setLoadingStates((prev) => ({ ...prev, userdata: true }));
        const result = await retryOperation(() =>
          client.get_user_rounds({ user })
        );
        setError(null);
        return result.result as bigint[];
      } catch (err) {
        console.error("Failed to fetch user rounds:", err);
        setError("Failed to fetch user rounds");
        return null;
      } finally {
        setLoadingStates((prev) => ({ ...prev, userdata: false }));
      }
    },
    [client]
  );

  // Approve token allowance for the prediction market contract
  const approveToken = useCallback(
    async (amount: bigint) => {
      if (
        !address ||
        !tokenClient ||
        !PredictionMarketClient ||
        !signTransaction
      ) {
        console.error("Client not initialized or wallet not connected");
        return false;
      }

      try {
        console.log(
          `📝 Approving ${amount} tokens for contract ${CONTRACT_ID}...`
        );

        const latestLedger = await stellarServer?.getLatestLedger();

        if (!latestLedger) {
          console.error("Failed to fetch latest ledger");
          return false;
        }

        const expirationLedger = latestLedger.sequence + 1_000_000;

        console.log("latestLedger:", latestLedger.sequence);
        console.log("expirationLedger:", expirationLedger);

        // Create the approve transaction
        const tx = await tokenClient.approve({
          from: address,
          spender: CONTRACT_ID,
          amount: amount,
          expiration_ledger: expirationLedger,
        });

        // Sign and send transaction
        const result = await tx.signAndSend();
        console.log("✅ Token approval Result :", result);

        const txResponse = result.getTransactionResponse;

        if (!txResponse) {
          console.error("No transaction response received");
          return false;
        }

        console.log(
          "✅ Token approval Transaction Response :",
          txResponse.status
        );

        console.log("✅ Token approval Transaction Hash:", txResponse.txHash);
        setError(null);
        return true;
      } catch (err) {
        console.error("Failed to approve token:", err);
        return false;
      }
    },
    [address, signTransaction]
  );

  // Place bet on bull (UP)
  const betBull = useCallback(
    async (epoch: bigint, amount: bigint) => {
      if (!client || !address) {
        setError("Client not initialized or wallet not connected");
        return null;
      }

      if (!stellarServer) {
        setError("Stellar server not initialized");
        return null;
      }

      if (!signTransaction) {
        setError("signTransaction function not available");
        return null;
      }

      try {
        setLoadingStates((prev) => ({ ...prev, betting: true }));

        // Then place the bet
        console.log("🎲 Step 2: Placing bet...");

        const tx = await client.bet_bull({
          epoch,
          user: address,
          amount: amount,
        });

        const result = await submitAndWaitForTransaction(
          tx.toXDR(),
          stellarServer,
          address,
          signTransaction
        );

        console.log("✅ Bet placed successfully:", result);

        setError(null);

        // Refresh current epoch and rounds after successful bet
        setTimeout(() => {
          fetchCurrentEpoch();
        }, 1000);

        return result;
      } catch (err) {
        console.error("Failed to place bull bet:", err);
        setError("Failed to place bet");
        return null;
      } finally {
        setLoadingStates((prev) => ({ ...prev, betting: false }));
      }
    },
    [client, address, fetchCurrentEpoch, approveToken]
  );

  // Place bet on bear (DOWN)
  const betBear = useCallback(
    async (epoch: bigint, amount: bigint) => {
      if (!client || !address) {
        setError("Client not initialized or wallet not connected");
        return null;
      }

      try {
        setLoadingStates((prev) => ({ ...prev, betting: true }));

        // First, approve the token allowance
        console.log("🔐 Step 1: Approving token allowance...");
        const approved = await approveToken(amount);
        if (!approved) {
          throw new Error("Token approval failed");
        }

        // Then place the bet
        console.log("🎲 Step 2: Placing bet...");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tx = await client.bet_bear({
          epoch,
          user: address,
          amount: amount as any, // Type assertion for i128
        });

        // Sign and send transaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (tx as any).signAndSend();
        setError(null);

        // Refresh current epoch and rounds after successful bet
        setTimeout(() => {
          fetchCurrentEpoch();
        }, 1000);

        return result as unknown;
      } catch (err) {
        console.error("Failed to place bear bet:", err);
        setError("Failed to place bet");
        return null;
      } finally {
        setLoadingStates((prev) => ({ ...prev, betting: false }));
      }
    },
    [client, address, fetchCurrentEpoch, approveToken]
  );

  // Get XLM oracle price
  const getOraclePrice = useCallback(async (): Promise<bigint | null> => {
    if (!client) return null;

    try {
      setLoadingStates((prev) => ({ ...prev, oracle: true }));
      const result = await retryOperation(() => client.get_xlm_oracle_price());
      setError(null);
      return result.result as bigint;
    } catch (err) {
      console.error("Failed to fetch oracle price:", err);
      setError("Failed to fetch oracle price");
      return null;
    } finally {
      setLoadingStates((prev) => ({ ...prev, oracle: false }));
    }
  }, [client]);

  // Get minimum bet amount
  const getMinBetAmount = useCallback(async (): Promise<bigint | null> => {
    if (!client) return null;

    try {
      const result = await retryOperation(() => client.get_min_bet_amount());
      return result.result as bigint;
    } catch (err) {
      console.error("Failed to fetch min bet amount:", err);
      return null;
    }
  }, [client]);

  // Get interval seconds
  const getIntervalSeconds = useCallback(async (): Promise<bigint | null> => {
    if (!client) return null;

    try {
      const result = await retryOperation(() => client.get_interval_seconds());
      return result.result as bigint;
    } catch (err) {
      console.error("Failed to fetch interval seconds:", err);
      return null;
    }
  }, [client]);

  // Auto-refresh polling mechanism
  useEffect(() => {
    if (!client || !autoRefresh) return;

    // Initial fetch
    fetchCurrentEpoch();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchCurrentEpoch();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [client, autoRefresh, fetchCurrentEpoch]);

  return {
    // Client
    client,

    // State
    currentEpoch,
    loadingStates,
    error,
    autoRefresh,
    setAutoRefresh,

    // Read operations
    fetchCurrentEpoch,
    fetchRound,
    fetchMultipleRounds,
    fetchCurrentAndNextRounds,
    fetchBetInfo,
    fetchUserRounds,

    // Write operations
    betBull,
    betBear,

    // Utility functions
    getOraclePrice,
    getMinBetAmount,
    getIntervalSeconds,

    // Computed loading states
    loading: Object.values(loadingStates).some((state) => state),
    isLoadingEpoch: loadingStates.epoch,
    isLoadingRounds: loadingStates.rounds,
    isLoadingBetting: loadingStates.betting,
    isLoadingOracle: loadingStates.oracle,
    isLoadingUserData: loadingStates.userdata,
  };
};
