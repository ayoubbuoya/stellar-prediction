use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol, Vec};
use stellar_access::ownable::{set_owner, Ownable};
use stellar_macros::{default_impl, only_owner};

use crate::{contract::reflector_oracle::Asset, flash::FlashLoanClient};

// Error codes
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
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

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Position {
    Bull,
    Bear,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BetInfo {
    pub position: Position,
    pub amount: i128,
    pub claimed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Round {
    pub epoch: u128,
    pub start_timestamp: u64,
    pub lock_timestamp: u64,
    pub close_timestamp: u64,
    pub lock_price: i128,
    pub close_price: i128,
    pub total_amount: i128,
    pub bull_amount: i128,
    pub bear_amount: i128,
    pub reward_base_cal_amount: i128,
    pub reward_amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Token,
    OracleAddress,
    IntervalSeconds,
    BufferSeconds,
    MinBetAmount,
    TreasuryFee,
    TreasuryAmount,
    CurrentEpoch,
    IsGenesisStarted,
    IsGenesisLocked,
    Paused,
    Initialized,
    Rounds(u128),
    BetInfos(u128, Address),
    UserRounds(Address),
    FlashLoanFee,
    FlashTreasuryAmount,
}

/////////////////////// EVENTS //////////////////////////////////

fn emit_round_started_event(
    e: &Env,
    epoch: u128,
    start_timestamp: u64,
    lock_timestamp: u64,
    close_timestamp: u64,
) {
    let topics = (Symbol::new(e, "ROUND_STARTED"), epoch);
    e.events()
        .publish(topics, (start_timestamp, lock_timestamp, close_timestamp));
}

fn emit_round_locked_event(e: &Env, epoch: u128, lock_timestamp: u64, lock_price: i128) {
    let topics = (Symbol::new(e, "ROUND_LOCKED"), epoch);
    e.events().publish(topics, (lock_timestamp, lock_price));
}

fn emit_bet_placed_event(e: &Env, epoch: u128, user: Address, amount: i128, position: Position) {
    let topics = (Symbol::new(e, "BET_PLACED"), epoch, user.clone());
    e.events().publish(topics, (amount, position));
}

fn emit_round_ended_event(e: &Env, epoch: u128, close_timestamp: u64, close_price: i128) {
    let topics = (Symbol::new(e, "ROUND_ENDED"), epoch);
    e.events().publish(topics, (close_timestamp, close_price));
}

fn emit_rewards_calculated_event(e: &Env, epoch: u128, reward_amount: i128, treasury_amt: i128) {
    let topics = (Symbol::new(e, "REWARDS_CALCULATED"), epoch);
    e.events().publish(topics, (reward_amount, treasury_amt));
}

fn emit_flash_loan_event(e: &Env, receiver: &Address, amount: i128, fee_amount: i128) {
    let topics = (Symbol::new(e, "FLASH_LOAN"), receiver.clone());
    e.events().publish(topics, (amount, fee_amount));
}

/////////////////////// CONSTANTS //////////////////////////////////

// Maximum treasury fee: 10%
const MAX_TREASURY_FEE: u32 = 1000; // 10%

// Import Rflector Oracle contarct using its wasm file
pub mod reflector_oracle {
    soroban_sdk::contractimport!(file = "./src/reflector-oracle.wasm");
}

#[contract]
pub struct PredictionMarket;

#[contractimpl]
impl PredictionMarket {
    /// Constructor to initialize the Prediction Market contract
    /// # Parameters
    /// - `owner`: Address of the contract owner
    /// - `intervals_seconds`: Duration of each prediction round in seconds
    /// - `min_bet_amount`: Minimum amount required to place a bet
    /// - `token_address`: Address of the token used for betting
    /// - `treasury_fee`: Fee percentage taken by the treasury (scaled by 100, e.g., 100 = 1%)
    pub fn __constructor(
        e: &Env,
        owner: Address,
        intervals_seconds: u64,
        buffer_seconds: u64,
        min_bet_amount: i128,
        token_address: Address,
        treasury_fee: u32,
        flash_loan_fee: u32,
        oracle_address: Address,
    ) {
        // Ensure Only Owner Can Call Constructor
        owner.require_auth();

        // Ensure that Treasury Fee is within limits
        assert!(treasury_fee <= MAX_TREASURY_FEE, "TREASURY_FEE_TOO_HIGH");
        assert!(
            flash_loan_fee <= MAX_TREASURY_FEE,
            "FLASH_LOAN_FEE_TOO_HIGH"
        );

        // Set Owner
        set_owner(e, &owner);

        // Initialize Interval Seconds
        e.storage()
            .instance()
            .set(&DataKey::IntervalSeconds, &intervals_seconds);

        // Initialize Buffer Seconds
        e.storage()
            .instance()
            .set(&DataKey::BufferSeconds, &buffer_seconds);

        // Initialize Minimum Bet Amount
        e.storage()
            .instance()
            .set(&DataKey::MinBetAmount, &min_bet_amount);

        // Initialize Token Address used for paying bets
        e.storage().instance().set(&DataKey::Token, &token_address);

        // Initialize Oracle Address used for fetching XLM price
        e.storage()
            .instance()
            .set(&DataKey::OracleAddress, &oracle_address);

        // Initialize Treasury Fee
        e.storage()
            .instance()
            .set(&DataKey::TreasuryFee, &treasury_fee);

        // Initialize Flash Borrow Fee
        e.storage()
            .instance()
            .set(&DataKey::FlashLoanFee, &flash_loan_fee);

        // Initialize Treasury Amount to 0
        e.storage().instance().set(&DataKey::TreasuryAmount, &0i128);

        // Initialize Current Epoch to 0
        e.storage().instance().set(&DataKey::CurrentEpoch, &0u128);

        // Set Initialized Flag to true
        e.storage().instance().set(&DataKey::Initialized, &true);

        // Set Paused Flag to false
        e.storage().instance().set(&DataKey::Paused, &false);

        // Set Genesis Started Flag to false
        e.storage()
            .instance()
            .set(&DataKey::IsGenesisStarted, &false);

        // Set Genesis Locked Flag to false
        e.storage()
            .instance()
            .set(&DataKey::IsGenesisLocked, &false);

        // Initialize Flash Treasury Amount to 0
        e.storage()
            .instance()
            .set(&DataKey::FlashTreasuryAmount, &0i128);
    }

    /// Function to start the genesis round
    /// Only callable by the owner
    #[only_owner]
    pub fn genesis_start_round(e: &Env) {
        let is_genesis_started: bool = e
            .storage()
            .instance()
            .get(&DataKey::IsGenesisStarted)
            .expect("IS_GENESIS_STARTED_NOT_FOUND");

        assert!(!is_genesis_started, "GENESIS_ALREADY_STARTED");

        let current_epoch: u128 = e
            .storage()
            .instance()
            .get(&DataKey::CurrentEpoch)
            .expect("CURRENT_EPOCH_NOT_FOUND");

        let new_epoch = current_epoch + 1;

        // Advance Current Epoch by 1
        e.storage()
            .instance()
            .set(&DataKey::CurrentEpoch, &new_epoch);

        // Start New Round
        Self::start_round(e, new_epoch);

        // Set Genesis Started Flag to true
        e.storage()
            .instance()
            .set(&DataKey::IsGenesisStarted, &true);
    }

    /// Function to lock the genesis round
    /// Only callable by the owner
    #[only_owner]
    pub fn genesis_lock_round(e: &Env) {
        let is_genesis_locked: bool = e
            .storage()
            .instance()
            .get(&DataKey::IsGenesisLocked)
            .expect("IS_GENESIS_LOCKED_NOT_FOUND");

        assert!(!is_genesis_locked, "GENESIS_ALREADY_LOCKED");

        let is_genesis_started: bool = e
            .storage()
            .instance()
            .get(&DataKey::IsGenesisStarted)
            .expect("IS_GENESIS_STARTED_NOT_FOUND");

        assert!(is_genesis_started, "GENESIS_NOT_STARTED");

        let current_epoch: u128 = e
            .storage()
            .instance()
            .get(&DataKey::CurrentEpoch)
            .expect("CURRENT_EPOCH_NOT_FOUND");

        // Get Token Price from Oracle
        let current_price = Self::get_token_price(e);

        // Safely Lock the Round
        Self::safe_lock_round(e, current_epoch, current_price);

        // Advance Current Epoch by 1
        let new_epoch = current_epoch + 1;

        e.storage()
            .instance()
            .set(&DataKey::CurrentEpoch, &new_epoch);

        // Start New Round
        Self::start_round(e, new_epoch);

        // Set Genesis Locked Flag to true
        e.storage().instance().set(&DataKey::IsGenesisLocked, &true);
    }

    #[only_owner]
    pub fn execute_round(e: &Env) {
        let is_genesis_locked: bool = e
            .storage()
            .instance()
            .get(&DataKey::IsGenesisLocked)
            .expect("IS_GENESIS_LOCKED_NOT_FOUND");

        let is_genesis_started: bool = e
            .storage()
            .instance()
            .get(&DataKey::IsGenesisStarted)
            .expect("IS_GENESIS_STARTED_NOT_FOUND");

        assert!(
            is_genesis_locked && is_genesis_started,
            "GENESIS_NOT_COMPLETED"
        );

        let current_epoch: u128 = e
            .storage()
            .instance()
            .get(&DataKey::CurrentEpoch)
            .expect("CURRENT_EPOCH_NOT_FOUND");

        // Get Token Price from Oracle
        let current_price = Self::get_token_price(e);

        // Safely Lock the current round
        Self::safe_lock_round(e, current_epoch, current_price);
        // Safely End the n - 1 round
        Self::safe_end_round(e, current_epoch - 1, current_price);
        // Calculate Rewards for the n - 1 round
        Self::calculate_rewards(e, current_epoch - 1);

        // Advance Current Epoch by 1
        let new_epoch = current_epoch + 1;
        e.storage()
            .instance()
            .set(&DataKey::CurrentEpoch, &new_epoch);

        // Safe start New Round
        Self::safe_start_round(e, new_epoch);
    }

    /// Function to place a bet on the bull side
    /// # Parameters
    /// - `epoch`: The epoch of the round to bet on
    /// - `user`: The address of the user placing the bet
    /// - `amount`: The amount of tokens to bet
    /// # Events
    /// - `BET_PLACED`: Emitted when a bet is placed
    pub fn bet_bull(e: &Env, epoch: u128, user: Address, amount: i128) {
        // User should authorize the bet
        user.require_auth();

        let current_epoch: u128 = e
            .storage()
            .instance()
            .get(&DataKey::CurrentEpoch)
            .expect("CURRENT_EPOCH_NOT_FOUND");

        // CHECK: Epoch should be the current epoch
        assert!(epoch == current_epoch, "INVALID_ROUND");

        // CHECK: Round should be bettable
        assert!(Self::is_bettable(e, epoch), "ROUND_NOT_BETTABLE");

        // CHECK: Amount should be greater than minimum bet amount
        let min_bet_amount: i128 = e
            .storage()
            .instance()
            .get(&DataKey::MinBetAmount)
            .expect("MIN_BET_AMOUNT_NOT_FOUND");

        assert!(amount >= min_bet_amount, "BET_AMOUNT_TOO_LOW");

        // CHECK: User should not have already placed a bet in this round
        assert!(Self::has_bet(e, epoch, &user), "ALREADY_BET_FOR_ROUND");

        // Get Token Address
        let token_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("TOKEN_ADDRESS_NOT_FOUND");

        // Create Token Client
        let token_client = token::Client::new(e, &token_address);

        // Safely transfer tokens from user to contract
        Self::safe_transfer_from_tokens(
            e,
            &token_client,
            &user,
            &e.current_contract_address(),
            amount,
        );

        // Update Round Info
        let mut round: Round = e
            .storage()
            .instance()
            .get(&DataKey::Rounds(epoch))
            .expect("ROUND_NOT_FOUND");

        round.total_amount += amount;
        round.bull_amount += amount;

        // Store Updated Round in Storage
        e.storage().instance().set(&DataKey::Rounds(epoch), &round);

        // Record Bet Info
        let bet_info = BetInfo {
            position: Position::Bull,
            amount,
            claimed: false,
        };

        // Store Bet Info in Storage
        let bet_info_key = DataKey::BetInfos(epoch, user.clone());

        e.storage().instance().set(&bet_info_key, &bet_info);

        // Get User Rounds (returns an empty vec if none exist)
        let mut user_rounds: Vec<u128> = e
            .storage()
            .instance()
            .get(&DataKey::UserRounds(user.clone()))
            .unwrap_or(Vec::new(&e));

        // Add Round to User Rounds
        user_rounds.push_back(epoch);

        // Store Updated User Rounds in Storage
        e.storage()
            .instance()
            .set(&DataKey::UserRounds(user.clone()), &user_rounds);

        // Emit an Event for Bet Placed
        emit_bet_placed_event(e, epoch, user, amount, Position::Bull);
    }

    /// Function to place a bet on the bear side
    /// # Parameters
    /// - `epoch`: The epoch of the round to bet on
    /// - `user`: The address of the user placing the bet
    /// - `amount`: The amount of tokens to bet
    /// # Events
    /// - `BET_PLACED`: Emitted when a bet is placed
    pub fn bet_bear(e: &Env, epoch: u128, user: Address, amount: i128) {
        // User should authorize the bet
        user.require_auth();

        let current_epoch: u128 = e
            .storage()
            .instance()
            .get(&DataKey::CurrentEpoch)
            .expect("CURRENT_EPOCH_NOT_FOUND");

        // CHECK: Epoch should be the current epoch
        assert!(epoch == current_epoch, "INVALID_ROUND");

        // CHECK: Round should be bettable
        assert!(Self::is_bettable(e, epoch), "ROUND_NOT_BETTABLE");

        // CHECK: Amount should be greater than minimum bet amount
        let min_bet_amount: i128 = e
            .storage()
            .instance()
            .get(&DataKey::MinBetAmount)
            .expect("MIN_BET_AMOUNT_NOT_FOUND");

        assert!(amount >= min_bet_amount, "BET_AMOUNT_TOO_LOW");

        // CHECK: User should not have already placed a bet in this round
        assert!(Self::has_bet(e, epoch, &user), "ALREADY_BET_FOR_ROUND");

        // Get Token Address
        let token_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("TOKEN_ADDRESS_NOT_FOUND");

        // Create Token Client
        let token_client = token::Client::new(e, &token_address);

        // Safely transfer tokens from user to contract
        Self::safe_transfer_from_tokens(
            e,
            &token_client,
            &user,
            &e.current_contract_address(),
            amount,
        );

        // Update Round Info
        let mut round: Round = e
            .storage()
            .instance()
            .get(&DataKey::Rounds(epoch))
            .expect("ROUND_NOT_FOUND");

        round.total_amount += amount;
        round.bear_amount += amount;

        // Store Updated Round in Storage
        e.storage().instance().set(&DataKey::Rounds(epoch), &round);

        // Record Bet Info
        let bet_info = BetInfo {
            position: Position::Bear,
            amount,
            claimed: false,
        };

        // Store Bet Info in Storage
        let bet_info_key = DataKey::BetInfos(epoch, user.clone());

        e.storage().instance().set(&bet_info_key, &bet_info);

        // Get User Rounds (returns an empty vec if none exist)
        let mut user_rounds: Vec<u128> = e
            .storage()
            .instance()
            .get(&DataKey::UserRounds(user.clone()))
            .unwrap_or(Vec::new(&e));

        // Add Round to User Rounds
        user_rounds.push_back(epoch);

        // Store Updated User Rounds in Storage
        e.storage()
            .instance()
            .set(&DataKey::UserRounds(user.clone()), &user_rounds);

        // Emit an Event for Bet Placed
        emit_bet_placed_event(e, epoch, user, amount, Position::Bear);
    }

    /// Flash loan function to borrow tokens temporarily    
    /// # Parameters
    /// - `amount`: The amount of tokens to borrow
    /// - `receiver`: The address of the receiver of the tokens
    pub fn flash_loan(e: &Env, amount: i128, receiver: Address) {
        // Get The Flash Loan Fee
        let flash_loan_fee: u32 = e
            .storage()
            .instance()
            .get(&DataKey::FlashLoanFee)
            .expect("FLASH_LOAN_FEE_NOT_FOUND");

        // Calculate The Fee Amount
        let fee_amount: i128 = (amount * flash_loan_fee as i128) / 10_000;

        // Get Token Address
        let token_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("TOKEN_ADDRESS_NOT_FOUND");

        // Create Token Client
        let token_client = token::Client::new(e, &token_address);

        let current_contract_address = e.current_contract_address();

        // Get The token balance before the flash loan
        let balance_before: i128 = token_client.balance(&current_contract_address);

        // Safely transfer tokens from contract to receiver
        Self::safe_transfer_tokens(
            e,
            &token_client,
            &current_contract_address,
            &receiver,
            amount,
        );

        // Receiver should implement the FlashLoanReceiver trait
        FlashLoanClient::new(e, &receiver).execute_flash_loan(
            &current_contract_address,
            &token_address,
            &amount,
            &fee_amount,
        );

        // Get The token balance after the flash loan
        let balance_after: i128 = token_client.balance(&current_contract_address);

        // Ensure that the receiver has repaid the loan plus fee
        assert!(
            balance_after >= balance_before + fee_amount,
            "FLASH_LOAN_NOT_REPAID"
        );

        // Update Flash Treasury Amount in Storage
        let mut flash_treasury_amount: i128 = e
            .storage()
            .instance()
            .get(&DataKey::FlashTreasuryAmount)
            .expect("FLASH_TREASURY_AMOUNT_NOT_FOUND");

        flash_treasury_amount += fee_amount;

        e.storage()
            .instance()
            .set(&DataKey::FlashTreasuryAmount, &flash_treasury_amount);

        // Emit an Event for Flash Loan
        emit_flash_loan_event(e, &receiver, amount, fee_amount);
    }

    //////////////////////////////// GETTERS ////////////////////////////////

    /// Internal function to get XLM price from the oracle
    /// # Returns
    /// - `i128`: XLM price in stroops
    pub fn get_xlm_oracle_price(e: &Env) -> i128 {
        let oracle_address: Address = e
            .storage()
            .instance()
            .get(&DataKey::OracleAddress)
            .expect("ORACLE_ADDRESS_NOT_FOUND");

        let oracle_client = reflector_oracle::Client::new(e, &oracle_address);

        let xlm_asset = Asset::Other(Symbol::new(&e, "XLM"));

        let recent_price = oracle_client.lastprice(&xlm_asset);

        recent_price.expect("INVALID_ORACLE_PRICE").price
    }

    pub fn get_is_genesis_started(e: &Env) -> bool {
        e.storage()
            .instance()
            .get(&DataKey::IsGenesisStarted)
            .expect("IS_GENESIS_STARTED_NOT_FOUND")
    }

    pub fn get_is_genesis_locked(e: &Env) -> bool {
        e.storage()
            .instance()
            .get(&DataKey::IsGenesisLocked)
            .expect("IS_GENESIS_LOCKED_NOT_FOUND")
    }

    pub fn get_current_epoch(e: &Env) -> u128 {
        e.storage()
            .instance()
            .get(&DataKey::CurrentEpoch)
            .expect("CURRENT_EPOCH_NOT_FOUND")
    }

    pub fn get_token_address(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::Token)
            .expect("TOKEN_ADDRESS_NOT_FOUND")
    }

    pub fn get_min_bet_amount(e: &Env) -> i128 {
        e.storage()
            .instance()
            .get(&DataKey::MinBetAmount)
            .expect("MIN_BET_AMOUNT_NOT_FOUND")
    }

    pub fn get_treasury_fee(e: &Env) -> u32 {
        e.storage()
            .instance()
            .get(&DataKey::TreasuryFee)
            .expect("TREASURY_FEE_NOT_FOUND")
    }

    pub fn get_treasury_amount(e: &Env) -> i128 {
        e.storage()
            .instance()
            .get(&DataKey::TreasuryAmount)
            .expect("TREASURY_AMOUNT_NOT_FOUND")
    }

    pub fn get_round(e: &Env, epoch: u128) -> Round {
        e.storage()
            .instance()
            .get(&DataKey::Rounds(epoch))
            .expect("ROUND_NOT_FOUND")
    }

    pub fn get_bet_info(e: &Env, epoch: u128, user: Address) -> BetInfo {
        let bet_info_key = DataKey::BetInfos(epoch, user);
        e.storage()
            .instance()
            .get(&bet_info_key)
            .expect("BET_INFO_NOT_FOUND")
    }

    pub fn get_user_rounds(e: &Env, user: Address) -> Vec<u128> {
        e.storage()
            .instance()
            .get(&DataKey::UserRounds(user))
            .unwrap_or(Vec::new(&e))
    }

    pub fn get_oracle_address(e: &Env) -> Address {
        e.storage()
            .instance()
            .get(&DataKey::OracleAddress)
            .expect("ORACLE_ADDRESS_NOT_FOUND")
    }

    pub fn get_interval_seconds(e: &Env) -> u64 {
        e.storage()
            .instance()
            .get(&DataKey::IntervalSeconds)
            .expect("INTERVAL_SECONDS_NOT_FOUND")
    }

    pub fn get_buffer_seconds(e: &Env) -> u64 {
        e.storage()
            .instance()
            .get(&DataKey::BufferSeconds)
            .expect("BUFFER_SECONDS_NOT_FOUND")
    }

    /// Readonly function to check if a round is bettable
    /// # Parameters
    /// - `epoch`: The epoch of the round to check
    /// # Returns
    /// - `bool`: True if the round is bettable, false otherwise
    pub fn is_bettable(e: &Env, epoch: u128) -> bool {
        let round: Round = e
            .storage()
            .instance()
            .get(&DataKey::Rounds(epoch))
            .expect("ROUND_NOT_FOUND");

        let current_timestamp: u64 = e.ledger().timestamp();

        round.start_timestamp != 0
            && round.lock_timestamp != 0
            && current_timestamp > round.start_timestamp
            && current_timestamp < round.lock_timestamp
    }

    //////////////////////////////// INTERNALS ////////////////////////////////

    /// Internal function to start a new round
    /// # Parameters
    /// - `epoch`: The epoch of the round to be started
    fn start_round(e: &Env, epoch: u128) {
        let start_timestamp = e.ledger().timestamp();

        // Get Interval Seconds
        let interval_seconds: u64 = e
            .storage()
            .instance()
            .get(&DataKey::IntervalSeconds)
            .expect("INTERVAL_SECONDS_NOT_FOUND");

        // lock_timestamp = start_timestamp + interval_seconds
        let lock_timestamp = start_timestamp + interval_seconds;

        // close_timestamp = start_timestamp + 2 * interval_seconds
        let close_timestamp = lock_timestamp + interval_seconds;

        // Create New Round
        let round = Round {
            epoch,
            start_timestamp,
            lock_timestamp,
            close_timestamp,
            lock_price: 0,
            close_price: 0,
            total_amount: 0,
            bull_amount: 0,
            bear_amount: 0,
            reward_base_cal_amount: 0,
            reward_amount: 0,
        };

        // Store Round in Storage
        e.storage().instance().set(&DataKey::Rounds(epoch), &round);

        // Emit an Event for Round Started
        emit_round_started_event(e, epoch, start_timestamp, lock_timestamp, close_timestamp);
    }

    /// Internal function to safely lock a round
    /// # Parameters
    /// - `epoch`: The epoch of the round to be locked
    /// - `current_price`: The current price fetched from the oracle
    fn safe_lock_round(e: &Env, epoch: u128, current_price: i128) {
        let mut round: Round = e
            .storage()
            .instance()
            .get(&DataKey::Rounds(epoch))
            .expect("ROUND_NOT_FOUND");

        // CHECK: Round should have started
        assert!(round.start_timestamp != 0, "CANNOT_LOCK_NON_STARTED_ROUND");

        let current_timestamp: u64 = e.ledger().timestamp();

        // CHECK: Current time should be after or equal to lock timestamp
        assert!(
            current_timestamp >= round.lock_timestamp,
            "CANNOT_LOCK_BEFORE_LOCK_TIMESTAMP"
        );

        let buffer_seconds: u64 = e
            .storage()
            .instance()
            .get(&DataKey::BufferSeconds)
            .expect("BUFFER_SECONDS_NOT_FOUND");

        // CHECK: Current time should be within buffer seconds of lock timestamp
        assert!(
            current_timestamp <= round.lock_timestamp + buffer_seconds,
            "CANNOT_LOCK_OUTSIDE_BUFFER"
        );

        let interval_seconds: u64 = e
            .storage()
            .instance()
            .get(&DataKey::IntervalSeconds)
            .expect("INTERVAL_SECONDS_NOT_FOUND");

        // Update Round Details on Lock
        round.lock_price = current_price;
        round.close_timestamp = current_timestamp + interval_seconds;

        // Store Updated Round in Storage
        e.storage().instance().set(&DataKey::Rounds(epoch), &round);

        // Emit an Event for Round Locked
        emit_round_locked_event(e, epoch, current_timestamp, current_price);
    }

    /// Internal function to safely end a round
    /// # Parameters
    /// - `epoch`: The epoch of the round to be ended
    /// - `current_price`: The current price fetched from the oracle
    fn safe_end_round(e: &Env, epoch: u128, current_price: i128) {
        let mut round: Round = e
            .storage()
            .instance()
            .get(&DataKey::Rounds(epoch))
            .expect("ROUND_NOT_FOUND");

        // CHECK: Round should be locked
        assert!(round.lock_timestamp != 0, "CANNOT_END_NON_LOCKED_ROUND");

        let current_timestamp: u64 = e.ledger().timestamp();

        // CHECK: Current time should be after or equal to close timestamp
        assert!(
            current_timestamp >= round.close_timestamp,
            "CANNOT_END_BEFORE_CLOSE_TIMESTAMP"
        );

        let buffer_seconds: u64 = e
            .storage()
            .instance()
            .get(&DataKey::BufferSeconds)
            .expect("BUFFER_SECONDS_NOT_FOUND");

        // CHECK: Current time should be within buffer seconds of close timestamp
        assert!(
            current_timestamp <= round.close_timestamp + buffer_seconds,
            "CANNOT_END_OUTSIDE_BUFFER"
        );

        round.close_price = current_price;

        // Store Updated Round in Storage
        e.storage().instance().set(&DataKey::Rounds(epoch), &round);

        // Emit an Event for Round Ended
        emit_round_ended_event(e, epoch, current_timestamp, current_price);
    }

    /// Internal function to safely start a new round
    /// # Parameters
    /// - `epoch`: The epoch of the round to be started
    /// # Events
    /// - `ROUND_STARTED`: Emitted when a new round is started
    fn safe_start_round(e: &Env, epoch: u128) {
        let is_genesis_started: bool = e
            .storage()
            .instance()
            .get(&DataKey::IsGenesisStarted)
            .expect("IS_GENESIS_STARTED_NOT_FOUND");

        assert!(is_genesis_started, "GENESIS_NOT_STARTED");

        // Get n -2 round
        let prev_prev_epoch = epoch - 2;

        let prev_prev_round: Round = e
            .storage()
            .instance()
            .get(&DataKey::Rounds(prev_prev_epoch))
            .expect("ROUND_NOT_FOUND");

        // CHECK: n - 2 round should be closed
        assert!(
            prev_prev_round.close_timestamp != 0,
            "CANNOT_START_BEFORE_PREV_PREV_ROUND_CLOSED"
        );

        Self::start_round(e, epoch);
    }

    /// Internal function to calculate rewards for a round
    /// # Parameters
    /// - `epoch`: The epoch of the round to calculate rewards for
    /// - # Events
    /// - `REWARDS_CALCULATED`: Emitted when rewards are calculated
    fn calculate_rewards(e: &Env, epoch: u128) {
        let mut round: Round = e
            .storage()
            .instance()
            .get(&DataKey::Rounds(epoch))
            .expect("ROUND_NOT_FOUND");

        // CHECK: Rewards should not have been calculated yet
        assert!(
            round.reward_amount == 0 && round.reward_base_cal_amount == 0,
            "REWARDS_ALREADY_CALCULATED"
        );

        let treasury_fee: u32 = e
            .storage()
            .instance()
            .get(&DataKey::TreasuryFee)
            .expect("TREASURY_FEE_NOT_FOUND");

        let treasury_amt: i128;

        // Determine Winning Side
        if round.close_price > round.lock_price {
            // Bull Wins
            round.reward_base_cal_amount = round.bull_amount;
            treasury_amt = (round.total_amount * treasury_fee as i128) / 10_000;
            round.reward_amount = round.total_amount - treasury_amt;
        } else if round.close_price < round.lock_price {
            // Bear Wins
            round.reward_base_cal_amount = round.bear_amount;
            treasury_amt = (round.total_amount * treasury_fee as i128) / 10_000;
            round.reward_amount = round.total_amount - treasury_amt;
        } else {
            // No one wins, all bets go to treasury
            round.reward_base_cal_amount = 0;
            treasury_amt = round.total_amount;
            round.reward_amount = 0;
        }

        // Store Updated Round in Storage
        e.storage().instance().set(&DataKey::Rounds(epoch), &round);

        // Update Treasury Amount in Storage
        let mut treasury_amount: i128 = e
            .storage()
            .instance()
            .get(&DataKey::TreasuryAmount)
            .expect("TREASURY_AMOUNT_NOT_FOUND");

        treasury_amount += treasury_amt;

        e.storage()
            .instance()
            .set(&DataKey::TreasuryAmount, &treasury_amount);

        // Emit an Event for Rewards Calculated
        emit_rewards_calculated_event(e, epoch, round.reward_amount, treasury_amt);
    }

    /// Internal function to get the token price from an oracle
    fn get_token_price(e: &Env) -> i128 {
        Self::get_xlm_oracle_price(e)
    }

    /// Internal function to check if a user has already placed a bet in a round
    /// # Parameters
    /// - `epoch`: The epoch of the round
    /// - `user`: The address of the user
    fn has_bet(e: &Env, epoch: u128, user: &Address) -> bool {
        let bet_info_key = DataKey::BetInfos(epoch, user.clone());
        let existing_bet_info: Option<BetInfo> = e.storage().instance().get(&bet_info_key);

        existing_bet_info.is_some()
    }

    /// Internal function to safely transfer tokens from a user to another address
    fn safe_transfer_from_tokens(
        e: &Env,
        token_client: &token::Client,
        from: &Address,
        to: &Address,
        amount: i128,
    ) {
        let from_balance = token_client.balance(from);

        assert!(from_balance >= amount, "INSUFFICIENT_BALANCE");

        let current_contract_address = e.current_contract_address();

        let from_allowance = token_client.allowance(from, &current_contract_address);

        assert!(from_allowance >= amount, "INSUFFICIENT_ALLOWANCE");

        token_client.transfer_from(&current_contract_address, from, to, &amount);
    }

    fn safe_transfer_tokens(
        _e: &Env,
        token_client: &token::Client,
        from: &Address,
        to: &Address,
        amount: i128,
    ) {
        let from_balance = token_client.balance(from);

        assert!(from_balance >= amount, "INSUFFICIENT_BALANCE");

        token_client.transfer(from, to, &amount);
    }
}

#[default_impl]
#[contractimpl]
impl Ownable for PredictionMarket {}
