use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};

use crate::{errors::MarketError, state::*};

#[derive(Accounts)]
pub struct MintCompleteSet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        has_one = collateral_mint,
        has_one = yes_mint,
        has_one = no_mint,
        has_one = collateral_vault,
        seeds = [b"market", market.creator.as_ref(), market.slug.as_bytes()],
        bump = market.market_bump,
    )]
    pub market: Box<Account<'info, Market>>,

    pub collateral_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub yes_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub no_mint: Box<Account<'info, Mint>>,

    #[account(mut, address = market.collateral_vault)]
    pub collateral_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = user,
    )]
    pub user_collateral: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = yes_mint,
        associated_token::authority = user,
    )]
    pub user_yes: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = no_mint,
        associated_token::authority = user,
    )]
    pub user_no: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[inline(never)]
fn do_transfer<'info>(
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
fn do_mint<'info>(
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

pub fn mint_complete_set(ctx: Context<MintCompleteSet>, amount: u64) -> Result<()> {
    require!(amount > 0, MarketError::ZeroAmount);
    require!(
        ctx.accounts.market.state == MarketState::Open,
        MarketError::MarketNotOpen
    );

    do_transfer(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.user_collateral.to_account_info(),
        ctx.accounts.collateral_vault.to_account_info(),
        ctx.accounts.user.to_account_info(),
        amount,
    )?;

    let creator = ctx.accounts.market.creator;
    let slug_bytes = ctx.accounts.market.slug.as_bytes().to_vec();
    let bump = [ctx.accounts.market.market_bump];
    let seeds: &[&[u8]] = &[b"market", creator.as_ref(), slug_bytes.as_slice(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];

    do_mint(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.yes_mint.to_account_info(),
        ctx.accounts.user_yes.to_account_info(),
        ctx.accounts.market.to_account_info(),
        signer,
        amount,
    )?;
    do_mint(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.no_mint.to_account_info(),
        ctx.accounts.user_no.to_account_info(),
        ctx.accounts.market.to_account_info(),
        signer,
        amount,
    )?;

    let m = &mut ctx.accounts.market;
    m.total_volume = m
        .total_volume
        .checked_add(amount)
        .ok_or(MarketError::MathOverflow)?;

    Ok(())
}
