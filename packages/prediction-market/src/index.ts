import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBFTXRJAL6SOBLBLWCXUIDCR7O6X4Q4AW2RHW7542BLBQUKLZRMYXEU5",
  },
} as const;

export enum Errors {
  NotAuthorized = 1,
  NotOperator = 2,
  NotAdmin = 3,
  AlreadyInitialized = 4,
  NotInitialized = 5,
  BetTooEarlyOrLate = 6,
  RoundNotBettable = 7,
  BetAmountTooLow = 8,
  AlreadyBet = 9,
  RoundNotStarted = 10,
  RoundNotEnded = 11,
  NotEligibleForClaim = 12,
  NotEligibleForRefund = 13,
  GenesisNotTriggered = 14,
  GenesisAlreadyTriggered = 15,
  TreasuryFeeTooHigh = 16,
  InvalidBufferInterval = 17,
  InvalidAmount = 18,
  InvalidAddress = 19,
  RoundAlreadyLocked = 20,
  RoundNotLocked = 21,
  OutsideBuffer = 22,
  RewardsAlreadyCalculated = 23,
  OracleUpdateExceeded = 24,
  OracleRoundIdTooLow = 25,
  TransferFailed = 26,
  Paused = 27,
  NotPaused = 28,
}

export type Position =
  | { tag: "Bull"; values: void }
  | { tag: "Bear"; values: void };

export interface BetInfo {
  amount: i128;
  claimed: boolean;
  position: Position;
}

export interface Round {
  bear_amount: i128;
  bull_amount: i128;
  close_price: i128;
  close_timestamp: u64;
  epoch: u128;
  lock_price: i128;
  lock_timestamp: u64;
  reward_amount: i128;
  reward_base_cal_amount: i128;
  start_timestamp: u64;
  total_amount: i128;
}

export type DataKey =
  | { tag: "Token"; values: void }
  | { tag: "OracleAddress"; values: void }
  | { tag: "IntervalSeconds"; values: void }
  | { tag: "BufferSeconds"; values: void }
  | { tag: "MinBetAmount"; values: void }
  | { tag: "TreasuryFee"; values: void }
  | { tag: "TreasuryAmount"; values: void }
  | { tag: "CurrentEpoch"; values: void }
  | { tag: "IsGenesisStarted"; values: void }
  | { tag: "IsGenesisLocked"; values: void }
  | { tag: "Paused"; values: void }
  | { tag: "Initialized"; values: void }
  | { tag: "Rounds"; values: readonly [u128] }
  | { tag: "BetInfos"; values: readonly [u128, string] }
  | { tag: "UserRounds"; values: readonly [string] }
  | { tag: "FlashLoanFee"; values: void };

/**
 * Storage key for enumeration of accounts per role.
 */
export interface RoleAccountKey {
  index: u32;
  role: string;
}

/**
 * Storage keys for the data associated with the access control
 */
export type AccessControlStorageKey =
  | { tag: "RoleAccounts"; values: readonly [RoleAccountKey] }
  | { tag: "HasRole"; values: readonly [string, string] }
  | { tag: "RoleAccountsCount"; values: readonly [string] }
  | { tag: "RoleAdmin"; values: readonly [string] }
  | { tag: "Admin"; values: void }
  | { tag: "PendingAdmin"; values: void };

export const AccessControlError = {
  1210: { message: "Unauthorized" },
  1211: { message: "AdminNotSet" },
  1212: { message: "IndexOutOfBounds" },
  1213: { message: "AdminRoleNotFound" },
  1214: { message: "RoleCountIsNotZero" },
  1215: { message: "RoleNotFound" },
  1216: { message: "AdminAlreadySet" },
  1217: { message: "RoleNotHeld" },
  1218: { message: "RoleIsEmpty" },
};

/**
 * Storage keys for `Ownable` utility.
 */
export type OwnableStorageKey =
  | { tag: "Owner"; values: void }
  | { tag: "PendingOwner"; values: void };

export const OwnableError = {
  1220: { message: "OwnerNotSet" },
  1221: { message: "TransferInProgress" },
  1222: { message: "OwnerAlreadySet" },
};

export const RoleTransferError = {
  1200: { message: "NoPendingTransfer" },
  1201: { message: "InvalidLiveUntilLedger" },
  1202: { message: "InvalidPendingAccount" },
};

export interface Client {
  /**
   * Construct and simulate a genesis_start_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Function to start the genesis round
   * Only callable by the owner
   */
  genesis_start_round: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a genesis_lock_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Function to lock the genesis round
   * Only callable by the owner
   */
  genesis_lock_round: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a execute_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  execute_round: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a bet_bull transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Function to place a bet on the bull side
   * # Parameters
   * - `epoch`: The epoch of the round to bet on
   * - `user`: The address of the user placing the bet
   * - `amount`: The amount of tokens to bet
   * # Events
   * - `BET_PLACED`: Emitted when a bet is placed
   */
  bet_bull: (
    { epoch, user, amount }: { epoch: u128; user: string; amount: i128 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a bet_bear transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Function to place a bet on the bear side
   * # Parameters
   * - `epoch`: The epoch of the round to bet on
   * - `user`: The address of the user placing the bet
   * - `amount`: The amount of tokens to bet
   * # Events
   * - `BET_PLACED`: Emitted when a bet is placed
   */
  bet_bear: (
    { epoch, user, amount }: { epoch: u128; user: string; amount: i128 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a flash_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Flash loan function to borrow tokens temporarily
   * # Parameters
   * - `amount`: The amount of tokens to borrow
   * - `receiver`: The address of the receiver of the tokens
   */
  flash_loan: (
    { amount, receiver }: { amount: i128; receiver: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_xlm_oracle_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Internal function to get XLM price from the oracle
   * # Returns
   * - `i128`: XLM price in stroops
   */
  get_xlm_oracle_price: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>;

  /**
   * Construct and simulate a get_is_genesis_started transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_is_genesis_started: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a get_is_genesis_locked transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_is_genesis_locked: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a get_current_epoch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_current_epoch: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u128>>;

  /**
   * Construct and simulate a get_token_address transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token_address: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_min_bet_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_min_bet_amount: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>;

  /**
   * Construct and simulate a get_treasury_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_treasury_fee: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>;

  /**
   * Construct and simulate a get_treasury_amount transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_treasury_amount: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>;

  /**
   * Construct and simulate a get_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_round: (
    { epoch }: { epoch: u128 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Round>>;

  /**
   * Construct and simulate a get_bet_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bet_info: (
    { epoch, user }: { epoch: u128; user: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<BetInfo>>;

  /**
   * Construct and simulate a get_user_rounds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_rounds: (
    { user }: { user: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Array<u128>>>;

  /**
   * Construct and simulate a get_oracle_address transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_oracle_address: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_interval_seconds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_interval_seconds: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>;

  /**
   * Construct and simulate a get_buffer_seconds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_buffer_seconds: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u64>>;

  /**
   * Construct and simulate a is_bettable transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Readonly function to check if a round is bettable
   * # Parameters
   * - `epoch`: The epoch of the round to check
   * # Returns
   * - `bool`: True if the round is bettable, false otherwise
   */
  is_bettable: (
    { epoch }: { epoch: u128 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<string>>>;

  /**
   * Construct and simulate a transfer_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_ownership: (
    {
      new_owner,
      live_until_ledger,
    }: { new_owner: string; live_until_ledger: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a accept_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  accept_ownership: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a renounce_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  renounce_ownership: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    {
      owner,
      intervals_seconds,
      buffer_seconds,
      min_bet_amount,
      token_address,
      treasury_fee,
      flash_loan_fee,
      oracle_address,
    }: {
      owner: string;
      intervals_seconds: u64;
      buffer_seconds: u64;
      min_bet_amount: i128;
      token_address: string;
      treasury_fee: u32;
      flash_loan_fee: u32;
      oracle_address: string;
    },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(
      {
        owner,
        intervals_seconds,
        buffer_seconds,
        min_bet_amount,
        token_address,
        treasury_fee,
        flash_loan_fee,
        oracle_address,
      },
      options,
    );
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAwAAAAAAAAAAAAAABUVycm9yAAAAAAAAHAAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAEAAAAAAAAAC05vdE9wZXJhdG9yAAAAAAIAAAAAAAAACE5vdEFkbWluAAAAAwAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAAEAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAABQAAAAAAAAARQmV0VG9vRWFybHlPckxhdGUAAAAAAAAGAAAAAAAAABBSb3VuZE5vdEJldHRhYmxlAAAABwAAAAAAAAAPQmV0QW1vdW50VG9vTG93AAAAAAgAAAAAAAAACkFscmVhZHlCZXQAAAAAAAkAAAAAAAAAD1JvdW5kTm90U3RhcnRlZAAAAAAKAAAAAAAAAA1Sb3VuZE5vdEVuZGVkAAAAAAAACwAAAAAAAAATTm90RWxpZ2libGVGb3JDbGFpbQAAAAAMAAAAAAAAABROb3RFbGlnaWJsZUZvclJlZnVuZAAAAA0AAAAAAAAAE0dlbmVzaXNOb3RUcmlnZ2VyZWQAAAAADgAAAAAAAAAXR2VuZXNpc0FscmVhZHlUcmlnZ2VyZWQAAAAADwAAAAAAAAASVHJlYXN1cnlGZWVUb29IaWdoAAAAAAAQAAAAAAAAABVJbnZhbGlkQnVmZmVySW50ZXJ2YWwAAAAAAAARAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAAEgAAAAAAAAAOSW52YWxpZEFkZHJlc3MAAAAAABMAAAAAAAAAElJvdW5kQWxyZWFkeUxvY2tlZAAAAAAAFAAAAAAAAAAOUm91bmROb3RMb2NrZWQAAAAAABUAAAAAAAAADU91dHNpZGVCdWZmZXIAAAAAAAAWAAAAAAAAABhSZXdhcmRzQWxyZWFkeUNhbGN1bGF0ZWQAAAAXAAAAAAAAABRPcmFjbGVVcGRhdGVFeGNlZWRlZAAAABgAAAAAAAAAE09yYWNsZVJvdW5kSWRUb29Mb3cAAAAAGQAAAAAAAAAOVHJhbnNmZXJGYWlsZWQAAAAAABoAAAAAAAAABlBhdXNlZAAAAAAAGwAAAAAAAAAJTm90UGF1c2VkAAAAAAAAHA==",
        "AAAAAgAAAAAAAAAAAAAACFBvc2l0aW9uAAAAAgAAAAAAAAAAAAAABEJ1bGwAAAAAAAAAAAAAAARCZWFy",
        "AAAAAQAAAAAAAAAAAAAAB0JldEluZm8AAAAAAwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAdjbGFpbWVkAAAAAAEAAAAAAAAACHBvc2l0aW9uAAAH0AAAAAhQb3NpdGlvbg==",
        "AAAAAQAAAAAAAAAAAAAABVJvdW5kAAAAAAAACwAAAAAAAAALYmVhcl9hbW91bnQAAAAACwAAAAAAAAALYnVsbF9hbW91bnQAAAAACwAAAAAAAAALY2xvc2VfcHJpY2UAAAAACwAAAAAAAAAPY2xvc2VfdGltZXN0YW1wAAAAAAYAAAAAAAAABWVwb2NoAAAAAAAACgAAAAAAAAAKbG9ja19wcmljZQAAAAAACwAAAAAAAAAObG9ja190aW1lc3RhbXAAAAAAAAYAAAAAAAAADXJld2FyZF9hbW91bnQAAAAAAAALAAAAAAAAABZyZXdhcmRfYmFzZV9jYWxfYW1vdW50AAAAAAALAAAAAAAAAA9zdGFydF90aW1lc3RhbXAAAAAABgAAAAAAAAAMdG90YWxfYW1vdW50AAAACw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAEAAAAAAAAAAAAAAABVRva2VuAAAAAAAAAAAAAAAAAAANT3JhY2xlQWRkcmVzcwAAAAAAAAAAAAAAAAAAD0ludGVydmFsU2Vjb25kcwAAAAAAAAAAAAAAAA1CdWZmZXJTZWNvbmRzAAAAAAAAAAAAAAAAAAAMTWluQmV0QW1vdW50AAAAAAAAAAAAAAALVHJlYXN1cnlGZWUAAAAAAAAAAAAAAAAOVHJlYXN1cnlBbW91bnQAAAAAAAAAAAAAAAAADEN1cnJlbnRFcG9jaAAAAAAAAAAAAAAAEElzR2VuZXNpc1N0YXJ0ZWQAAAAAAAAAAAAAAA9Jc0dlbmVzaXNMb2NrZWQAAAAAAAAAAAAAAAAGUGF1c2VkAAAAAAAAAAAAAAAAAAtJbml0aWFsaXplZAAAAAABAAAAAAAAAAZSb3VuZHMAAAAAAAEAAAAKAAAAAQAAAAAAAAAIQmV0SW5mb3MAAAACAAAACgAAABMAAAABAAAAAAAAAApVc2VyUm91bmRzAAAAAAABAAAAEwAAAAAAAAAAAAAADEZsYXNoTG9hbkZlZQ==",
        "AAAAAAAAAX1Db25zdHJ1Y3RvciB0byBpbml0aWFsaXplIHRoZSBQcmVkaWN0aW9uIE1hcmtldCBjb250cmFjdAojIFBhcmFtZXRlcnMKLSBgb3duZXJgOiBBZGRyZXNzIG9mIHRoZSBjb250cmFjdCBvd25lcgotIGBpbnRlcnZhbHNfc2Vjb25kc2A6IER1cmF0aW9uIG9mIGVhY2ggcHJlZGljdGlvbiByb3VuZCBpbiBzZWNvbmRzCi0gYG1pbl9iZXRfYW1vdW50YDogTWluaW11bSBhbW91bnQgcmVxdWlyZWQgdG8gcGxhY2UgYSBiZXQKLSBgdG9rZW5fYWRkcmVzc2A6IEFkZHJlc3Mgb2YgdGhlIHRva2VuIHVzZWQgZm9yIGJldHRpbmcKLSBgdHJlYXN1cnlfZmVlYDogRmVlIHBlcmNlbnRhZ2UgdGFrZW4gYnkgdGhlIHRyZWFzdXJ5IChzY2FsZWQgYnkgMTAwLCBlLmcuLCAxMDAgPSAxJSkAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAgAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAARaW50ZXJ2YWxzX3NlY29uZHMAAAAAAAAGAAAAAAAAAA5idWZmZXJfc2Vjb25kcwAAAAAABgAAAAAAAAAObWluX2JldF9hbW91bnQAAAAAAAsAAAAAAAAADXRva2VuX2FkZHJlc3MAAAAAAAATAAAAAAAAAAx0cmVhc3VyeV9mZWUAAAAEAAAAAAAAAA5mbGFzaF9sb2FuX2ZlZQAAAAAABAAAAAAAAAAOb3JhY2xlX2FkZHJlc3MAAAAAABMAAAAA",
        "AAAAAAAAAD5GdW5jdGlvbiB0byBzdGFydCB0aGUgZ2VuZXNpcyByb3VuZApPbmx5IGNhbGxhYmxlIGJ5IHRoZSBvd25lcgAAAAAAE2dlbmVzaXNfc3RhcnRfcm91bmQAAAAAAAAAAAA=",
        "AAAAAAAAAD1GdW5jdGlvbiB0byBsb2NrIHRoZSBnZW5lc2lzIHJvdW5kCk9ubHkgY2FsbGFibGUgYnkgdGhlIG93bmVyAAAAAAAAEmdlbmVzaXNfbG9ja19yb3VuZAAAAAAAAAAAAAA=",
        "AAAAAAAAAAAAAAANZXhlY3V0ZV9yb3VuZAAAAAAAAAAAAAAA",
        "AAAAAAAAAPFGdW5jdGlvbiB0byBwbGFjZSBhIGJldCBvbiB0aGUgYnVsbCBzaWRlCiMgUGFyYW1ldGVycwotIGBlcG9jaGA6IFRoZSBlcG9jaCBvZiB0aGUgcm91bmQgdG8gYmV0IG9uCi0gYHVzZXJgOiBUaGUgYWRkcmVzcyBvZiB0aGUgdXNlciBwbGFjaW5nIHRoZSBiZXQKLSBgYW1vdW50YDogVGhlIGFtb3VudCBvZiB0b2tlbnMgdG8gYmV0CiMgRXZlbnRzCi0gYEJFVF9QTEFDRURgOiBFbWl0dGVkIHdoZW4gYSBiZXQgaXMgcGxhY2VkAAAAAAAACGJldF9idWxsAAAAAwAAAAAAAAAFZXBvY2gAAAAAAAAKAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAPFGdW5jdGlvbiB0byBwbGFjZSBhIGJldCBvbiB0aGUgYmVhciBzaWRlCiMgUGFyYW1ldGVycwotIGBlcG9jaGA6IFRoZSBlcG9jaCBvZiB0aGUgcm91bmQgdG8gYmV0IG9uCi0gYHVzZXJgOiBUaGUgYWRkcmVzcyBvZiB0aGUgdXNlciBwbGFjaW5nIHRoZSBiZXQKLSBgYW1vdW50YDogVGhlIGFtb3VudCBvZiB0b2tlbnMgdG8gYmV0CiMgRXZlbnRzCi0gYEJFVF9QTEFDRURgOiBFbWl0dGVkIHdoZW4gYSBiZXQgaXMgcGxhY2VkAAAAAAAACGJldF9iZWFyAAAAAwAAAAAAAAAFZXBvY2gAAAAAAAAKAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAKBGbGFzaCBsb2FuIGZ1bmN0aW9uIHRvIGJvcnJvdyB0b2tlbnMgdGVtcG9yYXJpbHkKIyBQYXJhbWV0ZXJzCi0gYGFtb3VudGA6IFRoZSBhbW91bnQgb2YgdG9rZW5zIHRvIGJvcnJvdwotIGByZWNlaXZlcmA6IFRoZSBhZGRyZXNzIG9mIHRoZSByZWNlaXZlciBvZiB0aGUgdG9rZW5zAAAACmZsYXNoX2xvYW4AAAAAAAIAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAIcmVjZWl2ZXIAAAATAAAAAA==",
        "AAAAAAAAAFtJbnRlcm5hbCBmdW5jdGlvbiB0byBnZXQgWExNIHByaWNlIGZyb20gdGhlIG9yYWNsZQojIFJldHVybnMKLSBgaTEyOGA6IFhMTSBwcmljZSBpbiBzdHJvb3BzAAAAABRnZXRfeGxtX29yYWNsZV9wcmljZQAAAAAAAAABAAAACw==",
        "AAAAAAAAAAAAAAAWZ2V0X2lzX2dlbmVzaXNfc3RhcnRlZAAAAAAAAAAAAAEAAAAB",
        "AAAAAAAAAAAAAAAVZ2V0X2lzX2dlbmVzaXNfbG9ja2VkAAAAAAAAAAAAAAEAAAAB",
        "AAAAAAAAAAAAAAARZ2V0X2N1cnJlbnRfZXBvY2gAAAAAAAAAAAAAAQAAAAo=",
        "AAAAAAAAAAAAAAARZ2V0X3Rva2VuX2FkZHJlc3MAAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAASZ2V0X21pbl9iZXRfYW1vdW50AAAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAQZ2V0X3RyZWFzdXJ5X2ZlZQAAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAATZ2V0X3RyZWFzdXJ5X2Ftb3VudAAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAJZ2V0X3JvdW5kAAAAAAAAAQAAAAAAAAAFZXBvY2gAAAAAAAAKAAAAAQAAB9AAAAAFUm91bmQAAAA=",
        "AAAAAAAAAAAAAAAMZ2V0X2JldF9pbmZvAAAAAgAAAAAAAAAFZXBvY2gAAAAAAAAKAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAfQAAAAB0JldEluZm8A",
        "AAAAAAAAAAAAAAAPZ2V0X3VzZXJfcm91bmRzAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAA+oAAAAK",
        "AAAAAAAAAAAAAAASZ2V0X29yYWNsZV9hZGRyZXNzAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAUZ2V0X2ludGVydmFsX3NlY29uZHMAAAAAAAAAAQAAAAY=",
        "AAAAAAAAAAAAAAASZ2V0X2J1ZmZlcl9zZWNvbmRzAAAAAAAAAAAAAQAAAAY=",
        "AAAAAAAAAKxSZWFkb25seSBmdW5jdGlvbiB0byBjaGVjayBpZiBhIHJvdW5kIGlzIGJldHRhYmxlCiMgUGFyYW1ldGVycwotIGBlcG9jaGA6IFRoZSBlcG9jaCBvZiB0aGUgcm91bmQgdG8gY2hlY2sKIyBSZXR1cm5zCi0gYGJvb2xgOiBUcnVlIGlmIHRoZSByb3VuZCBpcyBiZXR0YWJsZSwgZmFsc2Ugb3RoZXJ3aXNlAAAAC2lzX2JldHRhYmxlAAAAAAEAAAAAAAAABWVwb2NoAAAAAAAACgAAAAEAAAAB",
        "AAAAAAAAAAAAAAAJZ2V0X293bmVyAAAAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAAAAAAASdHJhbnNmZXJfb3duZXJzaGlwAAAAAAACAAAAAAAAAAluZXdfb3duZXIAAAAAAAATAAAAAAAAABFsaXZlX3VudGlsX2xlZGdlcgAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAQYWNjZXB0X293bmVyc2hpcAAAAAAAAAAA",
        "AAAAAAAAAAAAAAAScmVub3VuY2Vfb3duZXJzaGlwAAAAAAAAAAAAAA==",
        "AAAAAQAAADFTdG9yYWdlIGtleSBmb3IgZW51bWVyYXRpb24gb2YgYWNjb3VudHMgcGVyIHJvbGUuAAAAAAAAAAAAAA5Sb2xlQWNjb3VudEtleQAAAAAAAgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAARyb2xlAAAAEQ==",
        "AAAAAgAAADxTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgYWNjZXNzIGNvbnRyb2wAAAAAAAAAF0FjY2Vzc0NvbnRyb2xTdG9yYWdlS2V5AAAAAAYAAAABAAAAAAAAAAxSb2xlQWNjb3VudHMAAAABAAAH0AAAAA5Sb2xlQWNjb3VudEtleQAAAAAAAQAAAAAAAAAHSGFzUm9sZQAAAAACAAAAEwAAABEAAAABAAAAAAAAABFSb2xlQWNjb3VudHNDb3VudAAAAAAAAAEAAAARAAAAAQAAAAAAAAAJUm9sZUFkbWluAAAAAAAAAQAAABEAAAAAAAAAAAAAAAVBZG1pbgAAAAAAAAAAAAAAAAAADFBlbmRpbmdBZG1pbg==",
        "AAAABAAAAAAAAAAAAAAAEkFjY2Vzc0NvbnRyb2xFcnJvcgAAAAAACQAAAAAAAAAMVW5hdXRob3JpemVkAAAEugAAAAAAAAALQWRtaW5Ob3RTZXQAAAAEuwAAAAAAAAAQSW5kZXhPdXRPZkJvdW5kcwAABLwAAAAAAAAAEUFkbWluUm9sZU5vdEZvdW5kAAAAAAAEvQAAAAAAAAASUm9sZUNvdW50SXNOb3RaZXJvAAAAAAS+AAAAAAAAAAxSb2xlTm90Rm91bmQAAAS/AAAAAAAAAA9BZG1pbkFscmVhZHlTZXQAAAAEwAAAAAAAAAALUm9sZU5vdEhlbGQAAAAEwQAAAAAAAAALUm9sZUlzRW1wdHkAAAAEwg==",
        "AAAAAgAAACNTdG9yYWdlIGtleXMgZm9yIGBPd25hYmxlYCB1dGlsaXR5LgAAAAAAAAAAEU93bmFibGVTdG9yYWdlS2V5AAAAAAAAAgAAAAAAAAAAAAAABU93bmVyAAAAAAAAAAAAAAAAAAAMUGVuZGluZ093bmVy",
        "AAAABAAAAAAAAAAAAAAADE93bmFibGVFcnJvcgAAAAMAAAAAAAAAC093bmVyTm90U2V0AAAABMQAAAAAAAAAElRyYW5zZmVySW5Qcm9ncmVzcwAAAAAExQAAAAAAAAAPT3duZXJBbHJlYWR5U2V0AAAABMY=",
        "AAAABAAAAAAAAAAAAAAAEVJvbGVUcmFuc2ZlckVycm9yAAAAAAAAAwAAAAAAAAARTm9QZW5kaW5nVHJhbnNmZXIAAAAAAASwAAAAAAAAABZJbnZhbGlkTGl2ZVVudGlsTGVkZ2VyAAAAAASxAAAAAAAAABVJbnZhbGlkUGVuZGluZ0FjY291bnQAAAAAAASy",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    genesis_start_round: this.txFromJSON<null>,
    genesis_lock_round: this.txFromJSON<null>,
    execute_round: this.txFromJSON<null>,
    bet_bull: this.txFromJSON<null>,
    bet_bear: this.txFromJSON<null>,
    flash_loan: this.txFromJSON<null>,
    get_xlm_oracle_price: this.txFromJSON<i128>,
    get_is_genesis_started: this.txFromJSON<boolean>,
    get_is_genesis_locked: this.txFromJSON<boolean>,
    get_current_epoch: this.txFromJSON<u128>,
    get_token_address: this.txFromJSON<string>,
    get_min_bet_amount: this.txFromJSON<i128>,
    get_treasury_fee: this.txFromJSON<u32>,
    get_treasury_amount: this.txFromJSON<i128>,
    get_round: this.txFromJSON<Round>,
    get_bet_info: this.txFromJSON<BetInfo>,
    get_user_rounds: this.txFromJSON<Array<u128>>,
    get_oracle_address: this.txFromJSON<string>,
    get_interval_seconds: this.txFromJSON<u64>,
    get_buffer_seconds: this.txFromJSON<u64>,
    is_bettable: this.txFromJSON<boolean>,
    get_owner: this.txFromJSON<Option<string>>,
    transfer_ownership: this.txFromJSON<null>,
    accept_ownership: this.txFromJSON<null>,
    renounce_ownership: this.txFromJSON<null>,
  };
}
