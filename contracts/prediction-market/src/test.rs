#![cfg(test)]

use mock_token::contract::{MyToken, MyTokenClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env,
};

use crate::contract::{reflector_oracle, Position, PredictionMarket, PredictionMarketClient};

const DEFAULT_TOKEN_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const DEFAULT_ORACLE_ID: &str = "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63";
const DEFAULT_INTERVAL_SECONDS: u64 = 300; // 5 minutes
const DEFAULT_BUFFER_SECONDS: u64 = 60; // 1 minute
const DEFAULT_MIN_BET_AMOUNT: i128 = 10000000; // 0.1 XLM
const DEFAULT_TREASURY_FEE: u32 = 500; // 5%

fn init_test<'a>(
    env: &Env,
) -> (
    Address,
    Address,
    Address,
    PredictionMarketClient<'a>,
    Address,
) {
    let admin = Address::generate(env);
    env.mock_all_auths();

    let oracle_id = env.register(reflector_oracle::WASM, ());

    let token_id = deploy_xlm_token(env, &admin);

    let contract_id = env.register(
        PredictionMarket,
        (
            &admin,
            DEFAULT_INTERVAL_SECONDS,
            DEFAULT_BUFFER_SECONDS,
            DEFAULT_MIN_BET_AMOUNT,
            &token_id,
            DEFAULT_TREASURY_FEE,
            &oracle_id,
        ),
    );

    let client = PredictionMarketClient::new(env, &contract_id);

    (admin, oracle_id, token_id, client, contract_id)
}

fn deploy_xlm_token(env: &Env, admin: &Address) -> Address {
    env.mock_all_auths();
    let contract_id = env.register(MyToken, (admin, 100000000000000000000000000i128));
    contract_id
}

#[test]
fn test_constructor() {
    let env = Env::default();
    let (admin, oracle_id, token_id, client, _) = init_test(&env);

    assert_eq!(client.get_owner().expect("OWNER_NOT_FOUND"), admin);
    assert_eq!(client.get_interval_seconds(), DEFAULT_INTERVAL_SECONDS);
    assert_eq!(client.get_buffer_seconds(), DEFAULT_BUFFER_SECONDS);
    assert_eq!(client.get_min_bet_amount(), DEFAULT_MIN_BET_AMOUNT);
    assert_eq!(client.get_treasury_fee(), DEFAULT_TREASURY_FEE);
    assert_eq!(client.get_token_address(), token_id);
    assert_eq!(client.get_oracle_address(), oracle_id);
}

#[test]
#[should_panic(expected = "GENESIS_ALREADY_STARTED")]
fn test_genesis_start_round_twice() {
    let env = Env::default();
    let (_, _, _, client, _) = init_test(&env);

    client.genesis_start_round();
    client.genesis_start_round(); // Should panic
}

#[test]
#[should_panic(expected = "GENESIS_NOT_STARTED")]
fn test_genesis_lock_round_before_start() {
    let env = Env::default();
    let (_, _, _, client, _) = init_test(&env);

    client.genesis_lock_round(); // Should panic
}

#[test]
fn test_genesis_round_flow() {
    let env = Env::default();

    let (_, _, _, client, _) = init_test(&env);

    client.genesis_start_round();

    assert_eq!(client.get_is_genesis_started(), true);

    assert_eq!(client.get_current_epoch(), 1);

    // Advance ledger time to after lock time
    let current_time = env.ledger().timestamp();

    let lock_time = current_time + DEFAULT_INTERVAL_SECONDS;

    env.ledger().set_timestamp(lock_time);

    // Lock the round
    client.genesis_lock_round();

    assert_eq!(client.get_is_genesis_locked(), true);
    assert_eq!(client.get_current_epoch(), 2);
    assert_eq!(client.get_round(&0u128).lock_timestamp, lock_time);
}
