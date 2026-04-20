use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::{errors::MarketError, state::*};

/// After a market resolves YES or NO, holders of the winning token burn it
/// 1:1 for USDC from the collateral vault. (Invalid resolution → use
/// `redeem_complete_set`, which requires matched YES+NO pairs.)
#[derive(Accounts)]
pub struct RedeemWinning<'info> {
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
        mut,
        token::mint = yes_mint,
        token::authority = user,
    )]
    pub user_yes: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = no_mint,
        token::authority = user,
    )]
    pub user_no: Box<Account<'info, TokenAccount>>,

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
fn do_transfer_signed<'info>(
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

pub fn redeem_winning(ctx: Context<RedeemWinning>, amount: u64) -> Result<()> {
    require!(amount > 0, MarketError::ZeroAmount);
    require!(
        ctx.accounts.market.state == MarketState::Resolved,
        MarketError::MarketNotOpen
    );

    let (burn_mint, burn_from) = match ctx.accounts.market.outcome {
        Outcome::Yes => (
            ctx.accounts.yes_mint.to_account_info(),
            ctx.accounts.user_yes.to_account_info(),
        ),
        Outcome::No => (
            ctx.accounts.no_mint.to_account_info(),
            ctx.accounts.user_no.to_account_info(),
        ),
        _ => return err!(MarketError::OutcomeAlreadySet),
    };

    do_burn(
        ctx.accounts.token_program.to_account_info(),
        burn_mint,
        burn_from,
        ctx.accounts.user.to_account_info(),
        amount,
    )?;

    let creator = ctx.accounts.market.creator;
    let slug_bytes = ctx.accounts.market.slug.as_bytes().to_vec();
    let bump = [ctx.accounts.market.market_bump];
    let seeds: &[&[u8]] = &[b"market", creator.as_ref(), slug_bytes.as_slice(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];

    do_transfer_signed(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.collateral_vault.to_account_info(),
        ctx.accounts.user_collateral.to_account_info(),
        ctx.accounts.market.to_account_info(),
        signer,
        amount,
    )?;

    Ok(())
}
