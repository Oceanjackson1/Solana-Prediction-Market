use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("3dphwMrHCNYzeAmeY8r6NNfdDCDrqYQQAuoDpHBZntGM");

#[program]
pub mod market {
    use super::*;

    pub fn create_market(ctx: Context<CreateMarket>, args: CreateMarketArgs) -> Result<()> {
        instructions::create_market::create_market(ctx, args)
    }

    pub fn mint_complete_set(ctx: Context<MintCompleteSet>, amount: u64) -> Result<()> {
        instructions::mint_complete_set::mint_complete_set(ctx, amount)
    }

    pub fn redeem_complete_set(ctx: Context<RedeemCompleteSet>, amount: u64) -> Result<()> {
        instructions::redeem_complete_set::redeem_complete_set(ctx, amount)
    }

    pub fn place_order(ctx: Context<PlaceOrder>, args: PlaceOrderArgs) -> Result<()> {
        instructions::place_order::place_order(ctx, args)
    }

    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        instructions::cancel_order::cancel_order(ctx)
    }

    pub fn take_order(ctx: Context<TakeOrder>, fill_amount: u64) -> Result<()> {
        instructions::take_order::take_order(ctx, fill_amount)
    }

    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        instructions::settle::settle(ctx)
    }

    pub fn redeem_winning(ctx: Context<RedeemWinning>, amount: u64) -> Result<()> {
        instructions::redeem_winning::redeem_winning(ctx, amount)
    }
}
