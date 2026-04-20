use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    curve::{cp_buy_yes, cp_sell_yes},
    errors::VaultError,
    state::*,
};

/// FPMM swap: user either buys YES with USDC, or sells YES for USDC.
/// `is_buy_yes`: true → pay USDC, receive YES. false → pay YES, receive USDC.
#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.market.as_ref(), pool.admin.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    pub collateral_mint: Box<Account<'info, Mint>>,
    pub yes_mint: Box<Account<'info, Mint>>,

    #[account(mut, address = pool.usdc_vault)]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, address = pool.yes_reserves)]
    pub yes_reserves: Box<Account<'info, TokenAccount>>,
    /// No-leg reserve is read only in this MVP (not transferred). Virtual.
    #[account(address = pool.no_reserves)]
    pub no_reserves: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = user,
    )]
    pub user_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = yes_mint,
        associated_token::authority = user,
    )]
    pub user_yes: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[inline(never)]
fn pull<'info>(
    token_program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new(token_program, Transfer { from, to, authority }),
        amount,
    )
}

#[inline(never)]
fn push<'info>(
    token_program: AccountInfo<'info>,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    signer: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new_with_signer(
            token_program,
            Transfer { from, to, authority },
            signer,
        ),
        amount,
    )
}

pub fn swap(
    ctx: Context<Swap>,
    is_buy_yes: bool,
    amount_in: u64,
    min_out: u64,
) -> Result<()> {
    require!(amount_in > 0, VaultError::ZeroAmount);

    let r_yes = ctx.accounts.yes_reserves.amount as u128;
    let r_no = ctx.accounts.no_reserves.amount as u128;
    let fee_bps = ctx.accounts.pool.fee_bps;

    let market = ctx.accounts.pool.market;
    let admin = ctx.accounts.pool.admin;
    let bump = [ctx.accounts.pool.bump];
    let seeds: &[&[u8]] = &[b"pool", market.as_ref(), admin.as_ref(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];

    let token_program = ctx.accounts.token_program.to_account_info();

    if is_buy_yes {
        let yes_out_u128 =
            cp_buy_yes(r_yes, r_no, amount_in as u128, fee_bps).ok_or(VaultError::MathOverflow)?;
        let yes_out = u64::try_from(yes_out_u128).map_err(|_| VaultError::MathOverflow)?;
        require!(yes_out >= min_out, VaultError::Slippage);
        require!(
            yes_out <= ctx.accounts.yes_reserves.amount,
            VaultError::InsufficientReserve
        );

        pull(
            token_program.clone(),
            ctx.accounts.user_usdc.to_account_info(),
            ctx.accounts.usdc_vault.to_account_info(),
            ctx.accounts.user.to_account_info(),
            amount_in,
        )?;
        push(
            token_program,
            ctx.accounts.yes_reserves.to_account_info(),
            ctx.accounts.user_yes.to_account_info(),
            ctx.accounts.pool.to_account_info(),
            signer,
            yes_out,
        )?;
        msg!("arena:vault:buy_yes usdc_in={} yes_out={}", amount_in, yes_out);
    } else {
        let usdc_out_u128 =
            cp_sell_yes(r_yes, r_no, amount_in as u128, fee_bps).ok_or(VaultError::MathOverflow)?;
        let usdc_out = u64::try_from(usdc_out_u128).map_err(|_| VaultError::MathOverflow)?;
        require!(usdc_out >= min_out, VaultError::Slippage);
        require!(
            usdc_out <= ctx.accounts.usdc_vault.amount,
            VaultError::InsufficientReserve
        );

        pull(
            token_program.clone(),
            ctx.accounts.user_yes.to_account_info(),
            ctx.accounts.yes_reserves.to_account_info(),
            ctx.accounts.user.to_account_info(),
            amount_in,
        )?;
        push(
            token_program,
            ctx.accounts.usdc_vault.to_account_info(),
            ctx.accounts.user_usdc.to_account_info(),
            ctx.accounts.pool.to_account_info(),
            signer,
            usdc_out,
        )?;
        msg!("arena:vault:sell_yes yes_in={} usdc_out={}", amount_in, usdc_out);
    }

    Ok(())
}
