
/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Round information from the backend
 */
export interface RoundData {
  epoch: string;
  startTimestamp: string;
  lockTimestamp: string;
  closeTimestamp: string;
  lockPrice: string;
  closePrice: string;
  totalAmount: string;
  bullAmount: string;
  bearAmount: string;
  rewardAmount: string;
  rewardBaseCalAmount: string;
}

/**
 * Current epoch response
 */
export interface CurrentEpochData {
  currentEpoch: string;
}

/**
 * Oracle price response
 */
export interface OraclePriceData {
  price: string;
  timestamp: string;
}

/**
 * Genesis status response
 */
export interface GenesisStatusData {
  isGenesisStarted: boolean;
  isGenesisLocked: boolean;
  currentEpoch: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  transactionHash: string;
  epoch: string;
}

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Default fetch options
 */
const defaultFetchOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
    });

    // Parse JSON response
    const data: ApiResponse<T> = await response.json();

    // Handle API-level errors
    if (!data.success) {
      throw new ApiError(
        data.error || 'API request failed',
        response.status,
        data
      );
    }

    // Return the data payload
    return data.data as T;
  } catch (error) {
    // Network or parsing errors
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiError(
        `Network error: ${error.message}`,
        undefined,
        error
      );
    }

    throw new ApiError('Unknown error occurred');
  }
}

// ============================================================================
// ROUNDS API
// ============================================================================

/**
 * Get information about a specific round
 * @param epoch - The epoch number of the round
 * @returns Round data
 */
export async function getRound(epoch: string | bigint): Promise<RoundData> {
  const epochStr = typeof epoch === 'bigint' ? epoch.toString() : epoch;
  return fetchApi<RoundData>(`/rounds/${epochStr}`);
}

/**
 * Get the current epoch number
 * @returns Current epoch data
 */
export async function getCurrentEpoch(): Promise<CurrentEpochData> {
  return fetchApi<CurrentEpochData>('/rounds/current');
}

/**
 * Execute a round (admin only)
 * Locks the current round, ends the previous round, and calculates rewards
 * @returns Transaction result
 */
export async function executeRound(): Promise<TransactionResult> {
  return fetchApi<TransactionResult>('/rounds/execute', {
    method: 'POST',
  });
}

// ============================================================================
// ORACLE API
// ============================================================================

/**
 * Get the current XLM price from the oracle
 * @returns Oracle price data with timestamp
 */
export async function getOraclePrice(): Promise<OraclePriceData> {
  return fetchApi<OraclePriceData>('/oracle/price');
}

// ============================================================================
// GENESIS API
// ============================================================================

/**
 * Get the current genesis status
 * @returns Genesis status including whether it's started and locked
 */
export async function getGenesisStatus(): Promise<GenesisStatusData> {
  return fetchApi<GenesisStatusData>('/genesis/status');
}

/**
 * Start the genesis round (admin only)
 * @returns Transaction result
 */
export async function startGenesisRound(): Promise<TransactionResult> {
  return fetchApi<TransactionResult>('/genesis/start', {
    method: 'POST',
  });
}

/**
 * Lock the genesis round (admin only)
 * @returns Transaction result
 */
export async function lockGenesisRound(): Promise<TransactionResult> {
  return fetchApi<TransactionResult>('/genesis/lock', {
    method: 'POST',
  });
}

// ============================================================================
// HEALTH CHECK API
// ============================================================================

/**
 * Health check response
 */
export interface HealthCheckData {
  status: string;
  timestamp: string;
}

/**
 * Check if the backend API is healthy
 * @returns Health status
 */
export async function healthCheck(): Promise<HealthCheckData> {
  const url = `${API_BASE_URL.replace('/api', '')}/api/health`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data as HealthCheckData;
  } catch (error) {
    throw new ApiError('Backend is not reachable');
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Fetch multiple rounds at once
 * @param epochs - Array of epoch numbers to fetch
 * @returns Array of round data (null for failed fetches)
 */
export async function getRounds(
  epochs: (string | bigint)[]
): Promise<(RoundData | null)[]> {
  const promises = epochs.map(async (epoch) => {
    try {
      return await getRound(epoch);
    } catch (error) {
      console.error(`Failed to fetch round ${epoch}:`, error);
      return null;
    }
  });

  return Promise.all(promises);
}

/**
 * Fetch the current epoch and the specified number of subsequent rounds
 * @param count - Number of rounds to fetch (default: 3)
 * @returns Object with current epoch and array of rounds
 */
export async function getCurrentAndNextRounds(count: number = 3): Promise<{
  currentEpoch: bigint;
  rounds: (RoundData | null)[];
}> {
  // Get current epoch
  const { currentEpoch } = await getCurrentEpoch();
  const currentEpochBigInt = BigInt(currentEpoch);

  // Generate epoch numbers for current and next rounds
  const epochs: bigint[] = [];
  for (let i = 0; i < count; i++) {
    epochs.push(currentEpochBigInt + BigInt(i));
  }

  // Fetch all rounds
  const rounds = await getRounds(epochs);

  return {
    currentEpoch: currentEpochBigInt,
    rounds,
  };
}

// ============================================================================
// EXPORT DEFAULT API CLIENT
// ============================================================================

/**
 * Main API client object with all methods
 */
export const api = {
  // Rounds
  getRound,
  getRounds,
  getCurrentEpoch,
  executeRound,
  getCurrentAndNextRounds,

  // Oracle
  getOraclePrice,

  // Genesis
  getGenesisStatus,
  startGenesisRound,
  lockGenesisRound,

  // Health
  healthCheck,
};

export default api;

