#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::contract::{MyToken, MyTokenClient};

pub fn deploy_my_token_contract(env: &Env, user: &Address, premint_amount: i128) -> Address {
    let contract_id = env.register(MyToken, (user, premint_amount));

    contract_id
}

#[test]
fn test_deploy_my_token() {
    let env = Env::default();
    let user = Address::generate(&env);
    let premint_amount = 100000000000000000000000;
    let contract_id = deploy_my_token_contract(&env, &user, premint_amount);
    let my_token_client = MyTokenClient::new(&env, &contract_id);

    // Verify metadata
    let name = my_token_client.name();
    let symbol = my_token_client.symbol();
    let decimals = my_token_client.decimals();
    let user_balance = my_token_client.balance(&user);

    let expected_name = String::from_str(&env, "MyToken");
    let expected_symbol = String::from_str(&env, "MTK");
    let expected_decimals = 7u32;
    let expected_user_balance = premint_amount;

    assert_eq!(name, expected_name);
    assert_eq!(symbol, expected_symbol);
    assert_eq!(decimals, expected_decimals);
    assert_eq!(user_balance, expected_user_balance);
}
