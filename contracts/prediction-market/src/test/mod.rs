#![cfg(test)]

mod types;

use mock_token::contract::{MyToken, MyTokenClient};
use soroban_sdk::{
    log,
    testutils::{Address as _, Ledger},
    Address, Env, Symbol, Vec,
};

use crate::contract::{
    reflector_oracle::{self, Asset, ConfigData},
    Position, PredictionMarket, PredictionMarketClient,
};

const DEFAULT_TOKEN_ID: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const DEFAULT_ORACLE_ID: &str = "CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63";
const DEFAULT_INTERVAL_SECONDS: u64 = 300; // 5 minutes
const DEFAULT_BUFFER_SECONDS: u64 = 60; // 1 minute
const DEFAULT_MIN_BET_AMOUNT: i128 = 10000000; // 0.1 XLM
const DEFAULT_TREASURY_FEE: u32 = 500; // 5%
const DEFAULT_FLASH_LOAN_FEE: u32 = 50; // 0.5%

// Oracle Reflector Settings
const REFLECTOR_RESOLUTION: u32 = 300_000;
const REFLECTOR_DECIMALS: u32 = 14;

fn normalize_price(price: i128) -> i128 {
    price * 10i128.pow(REFLECTOR_DECIMALS)
}

fn generate_asset(e: &Env) -> Vec<Asset> {
    let mut assets = Vec::new(&e);

    assets.push_back(Asset::Other(Symbol::new(e, &("XLM"))));

    assets
}

fn get_updates(env: &Env, assets: &Vec<Asset>, price: i128) -> Vec<i128> {
    let mut updates = Vec::new(&env);
    for _ in assets.iter() {
        updates.push_back(price);
    }
    updates
}

fn deploy_xlm_token(env: &Env, admin: &Address) -> Address {
    env.mock_all_auths();
    let contract_id = env.register(MyToken, (admin, 100000000000000000000000000i128));
    contract_id
}

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

    let init_data = ConfigData {
        admin: admin.clone(),
        period: (100 * REFLECTOR_RESOLUTION).into(),
        assets: generate_asset(&env),
        base_asset: Asset::Stellar(Address::generate(&env)),
        decimals: REFLECTOR_DECIMALS,
        resolution: REFLECTOR_RESOLUTION,
    };

    let reflect_client = reflector_oracle::Client::new(env, &oracle_id);

    // /set admin
    reflect_client.config(&init_data);

    // Set price
    let timestamp = 600_000;
    // update ledger time
    env.ledger().set_timestamp(timestamp / 1000);

    let updates = get_updates(&env, &init_data.assets, normalize_price(100));

    reflect_client.set_price(&updates, &timestamp);

    log!(env, "Oracle initialized with price data");

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
            DEFAULT_FLASH_LOAN_FEE,
            &oracle_id,
        ),
    );

    let client = PredictionMarketClient::new(env, &contract_id);

    (admin, oracle_id, token_id, client, contract_id)
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

    let ref_client = reflector_oracle::Client::new(&env, &oracle_id);

    let xlm_asset = Asset::Other(Symbol::new(&env, &("XLM")));

    let last_timestamp = ref_client.last_timestamp();
    let current_time = env.ledger().timestamp();
    assert_eq!(last_timestamp, current_time);

    let xlm_price = ref_client
        .lastprice(&xlm_asset)
        .expect("PRICE_NOT_FOUND")
        .price;

    log!(&env, "XLM Price from Oracle: {}", xlm_price);

    assert_eq!(xlm_price, normalize_price(100));
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
