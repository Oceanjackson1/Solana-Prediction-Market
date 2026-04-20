use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};

use crate::{errors::VaultError, state::*};

/// Deposit matched YES + NO (+ optional USDC buffer) into the pool,
/// receiving vLP in return. vLP is issued equal to the gross reserve
/// contribution (amount_usdc + amount_yes + amount_no).
#[derive(Accounts)]
pub struct ProvideLiquidity<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.market.as_ref(), pool.admin.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    pub collateral_mint: Box<Account<'info, Mint>>,
    pub yes_mint: Box<Account<'info, Mint>>,
    pub no_mint: Box<Account<'info, Mint>>,

    #[account(mut, address = pool.lp_mint)]
    pub lp_mint: Box<Account<'info, Mint>>,
    #[account(mut, address = pool.usdc_vault)]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, address = pool.yes_reserves)]
    pub yes_reserves: Box<Account<'info, TokenAccount>>,
    #[account(mut, address = pool.no_reserves)]
    pub no_reserves: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = provider,
    )]
    pub provider_usdc: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = yes_mint,
        token::authority = provider,
    )]
    pub provider_yes: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = no_mint,
        token::authority = provider,
    )]
    pub provider_no: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = provider,
        associated_token::mint = lp_mint,
        associated_token::authority = provider,
    )]
    pub provider_lp: Box<Account<'info, TokenAccount>>,

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
    if amount == 0 {
        return Ok(());
    }
    token::transfer(
        CpiContext::new(token_program, Transfer { from, to, authority }),
        amount,
    )
}

#[inline(never)]
fn mint_vlp<'info>(
    token_program: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    to: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    signer: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    token::mint_to(
        CpiContext::new_with_signer(
            token_program,
            MintTo { mint, to, authority },
            signer,
        ),
        amount,
    )
}

pub fn provide_liquidity(
    ctx: Context<ProvideLiquidity>,
    amount_usdc: u64,
    amount_yes: u64,
    amount_no: u64,
) -> Result<()> {
    require!(
        amount_usdc > 0 || (amount_yes > 0 && amount_no > 0),
        VaultError::ZeroAmount
    );

    let token_program = ctx.accounts.token_program.to_account_info();
    pull(
        token_program.clone(),
        ctx.accounts.provider_usdc.to_account_info(),
        ctx.accounts.usdc_vault.to_account_info(),
        ctx.accounts.provider.to_account_info(),
        amount_usdc,
    )?;
    pull(
        token_program.clone(),
        ctx.accounts.provider_yes.to_account_info(),
        ctx.accounts.yes_reserves.to_account_info(),
        ctx.accounts.provider.to_account_info(),
        amount_yes,
    )?;
    pull(
        token_program.clone(),
        ctx.accounts.provider_no.to_account_info(),
        ctx.accounts.no_reserves.to_account_info(),
        ctx.accounts.provider.to_account_info(),
        amount_no,
    )?;

    let gross = (amount_usdc as u128)
        .checked_add(amount_yes as u128)
        .and_then(|v| v.checked_add(amount_no as u128))
        .ok_or(VaultError::MathOverflow)?;
    let vlp_to_mint = u64::try_from(gross).map_err(|_| VaultError::MathOverflow)?;

    let market = ctx.accounts.pool.market;
    let admin = ctx.accounts.pool.admin;
    let bump = [ctx.accounts.pool.bump];
    let seeds: &[&[u8]] = &[b"pool", market.as_ref(), admin.as_ref(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];

    mint_vlp(
        token_program,
        ctx.accounts.lp_mint.to_account_info(),
        ctx.accounts.provider_lp.to_account_info(),
        ctx.accounts.pool.to_account_info(),
        signer,
        vlp_to_mint,
    )?;

    let p = &mut ctx.accounts.pool;
    p.lp_supply = p
        .lp_supply
        .checked_add(vlp_to_mint)
        .ok_or(VaultError::MathOverflow)?;

    msg!("arena:vault:provide vlp={}", vlp_to_mint);
    Ok(())
}
