import { useState, useEffect, useCallback } from "react";
import { Client as PredictionMarketClient, Round, BetInfo } from "prediction-market";
import { useWallet } from "./useWallet";

const CONTRACT_ID = import.meta.env.VITE_PREDICTION_MARKET_CONTRACT_ID || "CCRURKLYVROZ2OEDZJINGILO55AZBA642FRVCH23PEQGMQKYVBTE7G32";
const RPC_URL = import.meta.env.VITE_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

export const usePredictionMarket = () => {
  const { address } = useWallet();
  const [client, setClient] = useState<PredictionMarketClient | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize client
  useEffect(() => {
    const initClient = async () => {
      try {
        const predictionClient = new PredictionMarketClient({
          contractId: CONTRACT_ID,
          networkPassphrase: NETWORK_PASSPHRASE,
          rpcUrl: RPC_URL,
        });
        setClient(predictionClient);
      } catch (err) {
        console.error("Failed to initialize prediction market client:", err);
        setError("Failed to initialize client");
      }
    };

    initClient();
  }, []);

  // Fetch current epoch
  const fetchCurrentEpoch = useCallback(async () => {
    if (!client) return;

    try {
      setLoading(true);
      const result = await client.get_current_epoch();
      setCurrentEpoch(result.result as bigint);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch current epoch:", err);
      setError("Failed to fetch current epoch");
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Fetch round data
  const fetchRound = useCallback(
    async (epoch: bigint): Promise<Round | null> => {
      if (!client) return null;

      try {
        setLoading(true);
        const result = await client.get_round({ epoch });
        setError(null);
        return result.result as Round;
      } catch (err) {
        console.error(`Failed to fetch round ${epoch}:`, err);
        setError(`Failed to fetch round ${epoch}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  // Fetch user bet info
  const fetchBetInfo = useCallback(
    async (epoch: bigint, user: string): Promise<BetInfo | null> => {
      if (!client) return null;

      try {
        setLoading(true);
        const result = await client.get_bet_info({ epoch, user });
        setError(null);
        return result.result as BetInfo;
      } catch (err) {
        console.error(`Failed to fetch bet info for epoch ${epoch}:`, err);
        setError(`Failed to fetch bet info`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  // Fetch user rounds
  const fetchUserRounds = useCallback(
    async (user: string): Promise<bigint[] | null> => {
      if (!client) return null;

      try {
        setLoading(true);
        const result = await client.get_user_rounds({ user });
        setError(null);
        return result.result as bigint[];
      } catch (err) {
        console.error("Failed to fetch user rounds:", err);
        setError("Failed to fetch user rounds");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  // Place bet on bull (UP)
  const betBull = useCallback(
    async (epoch: bigint, amount: bigint) => {
      if (!client || !address) {
        setError("Client not initialized or wallet not connected");
        return null;
      }

      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tx = await client.bet_bull({
          epoch,
          user: address,
          amount: amount as any, // Type assertion for i128
        });

        // Sign and send transaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (tx as any).signAndSend();
        setError(null);
        return result as unknown;
      } catch (err) {
        console.error("Failed to place bull bet:", err);
        setError("Failed to place bet");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, address]
  );

  // Place bet on bear (DOWN)
  const betBear = useCallback(
    async (epoch: bigint, amount: bigint) => {
      if (!client || !address) {
        setError("Client not initialized or wallet not connected");
        return null;
      }

      try {
        setLoading(true);
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
        return result as unknown;
      } catch (err) {
        console.error("Failed to place bear bet:", err);
        setError("Failed to place bet");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, address]
  );

  // Get XLM oracle price
  const getOraclePrice = useCallback(async (): Promise<bigint | null> => {
    if (!client) return null;

    try {
      setLoading(true);
      const result = await client.get_xlm_oracle_price();
      setError(null);
      return result.result as bigint;
    } catch (err) {
      console.error("Failed to fetch oracle price:", err);
      setError("Failed to fetch oracle price");
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Get minimum bet amount
  const getMinBetAmount = useCallback(async (): Promise<bigint | null> => {
    if (!client) return null;

    try {
      const result = await client.get_min_bet_amount();
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
      const result = await client.get_interval_seconds();
      return result.result as bigint;
    } catch (err) {
      console.error("Failed to fetch interval seconds:", err);
      return null;
    }
  }, [client]);

  return {
    client,
    currentEpoch,
    loading,
    error,
    fetchCurrentEpoch,
    fetchRound,
    fetchBetInfo,
    fetchUserRounds,
    betBull,
    betBear,
    getOraclePrice,
    getMinBetAmount,
    getIntervalSeconds,
  };
};

