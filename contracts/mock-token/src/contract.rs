use soroban_sdk::{contract, contractimpl, Address, Env, String};
use stellar_access::ownable::{self as ownable, Ownable};
use stellar_macros::{default_impl, only_owner};
use stellar_tokens::fungible::{Base, FungibleToken};

#[contract]
pub struct MyToken;

#[contractimpl]
impl MyToken {
    pub fn __constructor(e: &Env, owner: Address, initial_supply: i128) {
        Base::set_metadata(
            e,
            7,
            String::from_str(e, "MyToken"),
            String::from_str(e, "MTK"),
        );

        Base::mint(e, &owner, initial_supply);

        ownable::set_owner(e, &owner);
    }

    #[only_owner]
    pub fn mint(e: &Env, account: Address, amount: i128) {
        Base::mint(e, &account, amount);
    }
}

#[default_impl]
#[contractimpl]
impl FungibleToken for MyToken {
    type ContractType = Base;
}

//
// Utils
//

#[default_impl]
#[contractimpl]
impl Ownable for MyToken {}
