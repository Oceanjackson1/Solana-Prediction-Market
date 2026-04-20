use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::{errors::MarketError, state::*};

/// Taker crosses `fill_amount` (in YES base units) against a single maker order
/// at the maker's price. For BuyYes makers: taker pays YES → receives USDC.
/// For SellYes makers: taker pays USDC → receives YES.
#[derive(Accounts)]
pub struct TakeOrder<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    /// CHECK: maker does not sign; we transfer tokens to their ATA.
    #[account(mut)]
    pub maker: UncheckedAccount<'info>,

    #[account(
        mut,
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
        has_one = market,
        constraint = order.maker == maker.key() @ MarketError::SideMismatch,
        seeds = [b"order", market.key().as_ref(), maker.key().as_ref(), &order.nonce.to_le_bytes()],
        bump = order.bump,
    )]
    pub order: Box<Account<'info, Order>>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = collateral_mint,
        associated_token::authority = taker,
    )]
    pub taker_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = yes_mint,
        associated_token::authority = taker,
    )]
    pub taker_yes: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = collateral_mint,
        associated_token::authority = maker,
    )]
    pub maker_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = yes_mint,
        associated_token::authority = maker,
    )]
    pub maker_yes: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[inline(never)]
fn transfer_from_taker<'info>(
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
fn transfer_from_market<'info>(
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

pub fn take_order(ctx: Context<TakeOrder>, fill_amount: u64) -> Result<()> {
    require!(fill_amount > 0, MarketError::ZeroAmount);
    require!(
        ctx.accounts.market.state == MarketState::Open,
        MarketError::MarketNotOpen
    );
    let order = &ctx.accounts.order;
    require!(order.remaining > 0, MarketError::OrderEmpty);
    require!(
        fill_amount <= order.remaining,
        MarketError::FillExceedsRemaining
    );

    let price = order.price;
    let side = order.side;
    let usdc_amount = cost_usdc(fill_amount, price).ok_or(MarketError::MathOverflow)?;

    let creator = ctx.accounts.market.creator;
    let slug_bytes = ctx.accounts.market.slug.as_bytes().to_vec();
    let bump = [ctx.accounts.market.market_bump];
    let seeds: &[&[u8]] = &[b"market", creator.as_ref(), slug_bytes.as_slice(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];

    match side {
        OrderSide::BuyYes => {
            // Taker pays YES to maker, receives USDC from collateral_vault.
            transfer_from_taker(
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.taker_yes.to_account_info(),
                ctx.accounts.maker_yes.to_account_info(),
                ctx.accounts.taker.to_account_info(),
                fill_amount,
            )?;
            transfer_from_market(
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.collateral_vault.to_account_info(),
                ctx.accounts.taker_usdc.to_account_info(),
                ctx.accounts.market.to_account_info(),
                signer,
                usdc_amount,
            )?;
        }
        OrderSide::SellYes => {
            // Taker pays USDC to maker, receives YES from ask_vault.
            transfer_from_taker(
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.taker_usdc.to_account_info(),
                ctx.accounts.maker_usdc.to_account_info(),
                ctx.accounts.taker.to_account_info(),
                usdc_amount,
            )?;
            transfer_from_market(
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.ask_vault.to_account_info(),
                ctx.accounts.taker_yes.to_account_info(),
                ctx.accounts.market.to_account_info(),
                signer,
                fill_amount,
            )?;
        }
    }

    let order = &mut ctx.accounts.order;
    order.remaining = order.remaining.saturating_sub(fill_amount);
    order.locked = match side {
        OrderSide::BuyYes => order.locked.saturating_sub(usdc_amount),
        OrderSide::SellYes => order.locked.saturating_sub(fill_amount),
    };

    let m = &mut ctx.accounts.market;
    m.total_volume = m
        .total_volume
        .checked_add(usdc_amount)
        .ok_or(MarketError::MathOverflow)?;

    Ok(())
}
