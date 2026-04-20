use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::{errors::MarketError, state::*};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateMarketArgs {
    pub slug: String,
    pub question: String,
    pub close_ts: i64,
    pub resolve_ts: i64,
}

#[derive(Accounts)]
#[instruction(args: CreateMarketArgs)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", creator.key().as_ref(), args.slug.as_bytes()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,

    pub collateral_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = creator,
        seeds = [b"yes_mint", market.key().as_ref()],
        bump,
        mint::decimals = collateral_mint.decimals,
        mint::authority = market,
    )]
    pub yes_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = creator,
        seeds = [b"no_mint", market.key().as_ref()],
        bump,
        mint::decimals = collateral_mint.decimals,
        mint::authority = market,
    )]
    pub no_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = creator,
        seeds = [b"vault", market.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = market,
    )]
    pub collateral_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = creator,
        seeds = [b"ask_vault", market.key().as_ref()],
        bump,
        token::mint = yes_mint,
        token::authority = market,
    )]
    pub ask_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_market(ctx: Context<CreateMarket>, args: CreateMarketArgs) -> Result<()> {
    require!(
        args.question.len() <= QUESTION_MAX_LEN,
        MarketError::QuestionTooLong
    );
    require!(args.slug.len() <= SLUG_MAX_LEN, MarketError::SlugTooLong);
    let now = Clock::get()?.unix_timestamp;
    require!(args.close_ts > now, MarketError::InvalidCloseTs);
    require!(
        args.resolve_ts >= args.close_ts,
        MarketError::InvalidResolveTs
    );

    let m = &mut ctx.accounts.market;
    m.creator = ctx.accounts.creator.key();
    m.collateral_mint = ctx.accounts.collateral_mint.key();
    m.yes_mint = ctx.accounts.yes_mint.key();
    m.no_mint = ctx.accounts.no_mint.key();
    m.collateral_vault = ctx.accounts.collateral_vault.key();
    m.ask_vault = ctx.accounts.ask_vault.key();
    m.close_ts = args.close_ts;
    m.resolve_ts = args.resolve_ts;
    m.state = MarketState::Open;
    m.outcome = Outcome::Pending;
    m.total_volume = 0;
    m.question = args.question;
    m.slug = args.slug;
    m.market_bump = ctx.bumps.market;
    m.yes_mint_bump = ctx.bumps.yes_mint;
    m.no_mint_bump = ctx.bumps.no_mint;
    m.vault_bump = ctx.bumps.collateral_vault;
    m.ask_vault_bump = ctx.bumps.ask_vault;

    msg!("arena:market:create slug={} close_ts={}", m.slug, m.close_ts);
    Ok(())
}
