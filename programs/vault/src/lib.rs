use anchor_lang::prelude::*;

pub mod curve;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("7qmi9b1z7DvDMRDhFf6nzahtCkuA5xRaesv3QphT4gQJ");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        instructions::initialize_pool::initialize_pool(ctx)
    }

    pub fn provide_liquidity(
        ctx: Context<ProvideLiquidity>,
        amount_usdc: u64,
        amount_yes: u64,
        amount_no: u64,
    ) -> Result<()> {
        instructions::provide_liquidity::provide_liquidity(ctx, amount_usdc, amount_yes, amount_no)
    }

    pub fn swap(
        ctx: Context<Swap>,
        is_buy_yes: bool,
        amount_in: u64,
        min_out: u64,
    ) -> Result<()> {
        instructions::swap::swap(ctx, is_buy_yes, amount_in, min_out)
    }

    pub fn withdraw(ctx: Context<Withdraw>, vlp_amount: u64) -> Result<()> {
        instructions::withdraw::withdraw(ctx, vlp_amount)
    }
}
