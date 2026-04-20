use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{errors::MarketError, state::*};

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        has_one = collateral_mint,
        has_one = yes_mint,
        has_one = collateral_vault,
        has_one = ask_vault,
        seeds = [b"market", market.creator.as_ref(), market.slug.as_bytes()],
        bump = market.market_bump,
    )]
    pub market: Box<Account<'info, Market>>,

    pub collateral_mint: Box<Account<'info, Mint>>,
    pub yes_mint: Box<Account<'info, Mint>>,

    #[account(mut, address = market.collateral_vault)]
    pub collateral_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut, address = market.ask_vault)]
    pub ask_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        close = maker,
        seeds = [b"order", market.key().as_ref(), maker.key().as_ref(), &order.nonce.to_le_bytes()],
        bump = order.bump,
        has_one = maker,
        has_one = market,
    )]
    pub order: Box<Account<'info, Order>>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = maker,
    )]
    pub maker_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = yes_mint,
        token::authority = maker,
    )]
    pub maker_yes: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
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

pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
    let refund = ctx.accounts.order.locked;
    if refund == 0 {
        return Ok(());
    }

    let creator = ctx.accounts.market.creator;
    let slug_bytes = ctx.accounts.market.slug.as_bytes().to_vec();
    let bump = [ctx.accounts.market.market_bump];
    let seeds: &[&[u8]] = &[b"market", creator.as_ref(), slug_bytes.as_slice(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];

    let (from, to) = match ctx.accounts.order.side {
        OrderSide::BuyYes => (
            ctx.accounts.collateral_vault.to_account_info(),
            ctx.accounts.maker_usdc.to_account_info(),
        ),
        OrderSide::SellYes => (
            ctx.accounts.ask_vault.to_account_info(),
            ctx.accounts.maker_yes.to_account_info(),
        ),
    };

    do_transfer_signed(
        ctx.accounts.token_program.to_account_info(),
        from,
        to,
        ctx.accounts.market.to_account_info(),
        signer,
        refund,
    )
}
