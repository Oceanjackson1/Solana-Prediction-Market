use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::*;

/// Creates a new pool for a given market. One pool per (market, admin) pair.
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: we only store this pubkey.
    pub market: UncheckedAccount<'info>,

    pub collateral_mint: Box<Account<'info, Mint>>,
    pub yes_mint: Box<Account<'info, Mint>>,
    pub no_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool", market.key().as_ref(), admin.key().as_ref()],
        bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"lp_mint", pool.key().as_ref()],
        bump,
        mint::decimals = collateral_mint.decimals,
        mint::authority = pool,
    )]
    pub lp_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"usdc_vault", pool.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = pool,
    )]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"yes_reserves", pool.key().as_ref()],
        bump,
        token::mint = yes_mint,
        token::authority = pool,
    )]
    pub yes_reserves: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = admin,
        seeds = [b"no_reserves", pool.key().as_ref()],
        bump,
        token::mint = no_mint,
        token::authority = pool,
    )]
    pub no_reserves: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
    let p = &mut ctx.accounts.pool;
    p.market = ctx.accounts.market.key();
    p.admin = ctx.accounts.admin.key();
    p.collateral_mint = ctx.accounts.collateral_mint.key();
    p.yes_mint = ctx.accounts.yes_mint.key();
    p.no_mint = ctx.accounts.no_mint.key();
    p.lp_mint = ctx.accounts.lp_mint.key();
    p.usdc_vault = ctx.accounts.usdc_vault.key();
    p.yes_reserves = ctx.accounts.yes_reserves.key();
    p.no_reserves = ctx.accounts.no_reserves.key();
    p.lp_supply = 0;
    p.fee_bps = DEFAULT_FEE_BPS;
    p.bump = ctx.bumps.pool;
    p.lp_mint_bump = ctx.bumps.lp_mint;
    p.usdc_vault_bump = ctx.bumps.usdc_vault;
    p.yes_reserves_bump = ctx.bumps.yes_reserves;
    p.no_reserves_bump = ctx.bumps.no_reserves;
    Ok(())
}
