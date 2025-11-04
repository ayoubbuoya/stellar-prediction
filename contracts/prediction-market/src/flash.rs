use soroban_sdk::{contractclient, Address, Env};

#[contractclient(name = "FlashLoanClient")]
pub trait FlashLoanReceiver {
    fn execute_flash_loan(env: Env, caller: Address, token: Address, amount: i128, fee_amount: i128);
}
