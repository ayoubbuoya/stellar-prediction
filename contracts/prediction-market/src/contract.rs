use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol, Vec};
use stellar_access::ownable::{set_owner, Ownable};
use stellar_macros::{default_impl, only_owner};

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

/////////////////////// CONSTANTS //////////////////////////////////

// Maximum treasury fee: 10%
const MAX_TREASURY_FEE: u32 = 1000; // 10%
const TOKEN_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// TODO: Implement whenNotPaused Macro

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
    ) {
        // Ensure Only Owner Can Call Constructor
        owner.require_auth();

        // Ensure that Treasury Fee is within limits
        assert!(treasury_fee <= MAX_TREASURY_FEE, "TREASURY_FEE_TOO_HIGH");

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

        // Initialize Token Address
        e.storage().instance().set(&DataKey::Token, &token_address);

        // Initialize Treasury Fee
        e.storage()
            .instance()
            .set(&DataKey::TreasuryFee, &treasury_fee);

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

    /// Function to place a bet on the bull side
    /// # Parameters
    /// - `epoch`: The epoch of the round to bet on
    /// - `user`: The address of the user placing the bet
    /// - `amount`: The amount of tokens to bet
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

    /// Internal function to get the token price from an oracle
    fn get_token_price(_e: &Env) -> i128 {
        // Here you would typically fetch the price from an oracle.
        // For simplicity, we'll set a dummy price.
        1000 // Dummy price
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
}

#[default_impl]
#[contractimpl]
impl Ownable for PredictionMarket {}
