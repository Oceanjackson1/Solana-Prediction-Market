use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::{errors::MarketError, state::*};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlaceOrderArgs {
    pub side: OrderSide,
    pub price: u64,  // USDC per YES × UNIT, 0 < price < UNIT
    pub amount: u64, // YES base units
    pub nonce: u64,  // client-supplied uniqueness for order PDA
}

#[derive(Accounts)]
#[instruction(args: PlaceOrderArgs)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

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
        init,
        payer = maker,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", market.key().as_ref(), maker.key().as_ref(), &args.nonce.to_le_bytes()],
        bump,
    )]
    pub order: Box<Account<'info, Order>>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = maker,
    )]
    pub maker_usdc: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = maker,
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

pub fn place_order(ctx: Context<PlaceOrder>, args: PlaceOrderArgs) -> Result<()> {
    require!(args.amount > 0, MarketError::ZeroAmount);
    require!(
        args.price > 0 && args.price < UNIT,
        MarketError::InvalidPrice
    );
    require!(
        ctx.accounts.market.state == MarketState::Open,
        MarketError::MarketNotOpen
    );

    let locked = match args.side {
        OrderSide::BuyYes => cost_usdc(args.amount, args.price).ok_or(MarketError::MathOverflow)?,
        OrderSide::SellYes => args.amount,
    };

    match args.side {
        OrderSide::BuyYes => do_transfer(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.maker_usdc.to_account_info(),
            ctx.accounts.collateral_vault.to_account_info(),
            ctx.accounts.maker.to_account_info(),
            locked,
        )?,
        OrderSide::SellYes => do_transfer(
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.maker_yes.to_account_info(),
            ctx.accounts.ask_vault.to_account_info(),
            ctx.accounts.maker.to_account_info(),
            locked,
        )?,
    }

    let now = Clock::get()?.unix_timestamp;
    let o = &mut ctx.accounts.order;
    o.market = ctx.accounts.market.key();
    o.maker = ctx.accounts.maker.key();
    o.side = args.side;
    o.price = args.price;
    o.remaining = args.amount;
    o.locked = locked;
    o.nonce = args.nonce;
    o.created_at = now;
    o.bump = ctx.bumps.order;

    Ok(())
}
