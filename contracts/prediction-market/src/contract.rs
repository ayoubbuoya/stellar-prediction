//! Ownable Example Contract.
//!
//! Demonstrates an example usage of `ownable` module by
//! implementing `#[only_owner]` macro on a sensitive function.

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};
use stellar_access::ownable::{set_owner, Ownable};
use stellar_macros::{default_impl, only_owner};

#[contracttype]
pub enum DataKey {
    Owner,
    Counter,
}

#[contract]
pub struct Prediction;

#[contractimpl]
impl Prediction {
    pub fn __constructor(e: &Env, owner: Address) {
        set_owner(e, &owner);
        e.storage().instance().set(&DataKey::Counter, &0);
    }

    #[only_owner]
    pub fn increment(e: &Env) -> i32 {
        let mut counter: i32 =
            e.storage().instance().get(&DataKey::Counter).expect("counter should be set");

        counter += 1;

        e.storage().instance().set(&DataKey::Counter, &counter);

        counter
    }
}

#[default_impl]
#[contractimpl]
impl Ownable for Prediction {}
