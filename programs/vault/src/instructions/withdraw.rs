use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::{errors::VaultError, state::*};

/// Burn vLP, receive pro-rata share of all three reserves (USDC + YES + NO).
#[derive(Accounts)]
pub struct Withdraw<'info> {
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
        token::mint = lp_mint,
        token::authority = provider,
    )]
    pub provider_lp: Box<Account<'info, TokenAccount>>,
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

    pub token_program: Program<'info, Token>,
}

#[inline(never)]
fn do_burn<'info>(
    token_program: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    from: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    token::burn(
        CpiContext::new(token_program, Burn { mint, from, authority }),
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
    if amount == 0 {
        return Ok(());
    }
    token::transfer(
        CpiContext::new_with_signer(
            token_program,
            Transfer { from, to, authority },
            signer,
        ),
        amount,
    )
}

pub fn withdraw(ctx: Context<Withdraw>, vlp_amount: u64) -> Result<()> {
    require!(vlp_amount > 0, VaultError::ZeroAmount);
    let supply = ctx.accounts.pool.lp_supply;
    require!(supply > 0, VaultError::NotSeeded);
    require!(vlp_amount <= supply, VaultError::InsufficientReserve);

    let ru = ctx.accounts.usdc_vault.amount as u128;
    let ry = ctx.accounts.yes_reserves.amount as u128;
    let rn = ctx.accounts.no_reserves.amount as u128;
    let s = supply as u128;
    let v = vlp_amount as u128;

    let out_usdc = ru.checked_mul(v).and_then(|x| x.checked_div(s)).ok_or(VaultError::MathOverflow)?;
    let out_yes = ry.checked_mul(v).and_then(|x| x.checked_div(s)).ok_or(VaultError::MathOverflow)?;
    let out_no = rn.checked_mul(v).and_then(|x| x.checked_div(s)).ok_or(VaultError::MathOverflow)?;

    let out_usdc = u64::try_from(out_usdc).map_err(|_| VaultError::MathOverflow)?;
    let out_yes = u64::try_from(out_yes).map_err(|_| VaultError::MathOverflow)?;
    let out_no = u64::try_from(out_no).map_err(|_| VaultError::MathOverflow)?;

    do_burn(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.lp_mint.to_account_info(),
        ctx.accounts.provider_lp.to_account_info(),
        ctx.accounts.provider.to_account_info(),
        vlp_amount,
    )?;

    let market = ctx.accounts.pool.market;
    let admin = ctx.accounts.pool.admin;
    let bump = [ctx.accounts.pool.bump];
    let seeds: &[&[u8]] = &[b"pool", market.as_ref(), admin.as_ref(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];
    let token_program = ctx.accounts.token_program.to_account_info();
    let authority = ctx.accounts.pool.to_account_info();

    push(
        token_program.clone(),
        ctx.accounts.usdc_vault.to_account_info(),
        ctx.accounts.provider_usdc.to_account_info(),
        authority.clone(),
        signer,
        out_usdc,
    )?;
    push(
        token_program.clone(),
        ctx.accounts.yes_reserves.to_account_info(),
        ctx.accounts.provider_yes.to_account_info(),
        authority.clone(),
        signer,
        out_yes,
    )?;
    push(
        token_program,
        ctx.accounts.no_reserves.to_account_info(),
        ctx.accounts.provider_no.to_account_info(),
        authority,
        signer,
        out_no,
    )?;

    let p = &mut ctx.accounts.pool;
    p.lp_supply = p
        .lp_supply
        .checked_sub(vlp_amount)
        .ok_or(VaultError::MathOverflow)?;

    Ok(())
}
