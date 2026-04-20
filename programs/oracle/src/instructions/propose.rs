use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{errors::OracleError, state::*};

#[derive(Accounts)]
pub struct Propose<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    /// CHECK: market pubkey — proposal is keyed by market but oracle does not
    /// dereference market state (that's the market program's job).
    pub market: UncheckedAccount<'info>,

    pub collateral_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", market.key().as_ref()],
        bump,
    )]
    pub proposal: Box<Account<'info, Proposal>>,

    #[account(
        init,
        payer = proposer,
        seeds = [b"bond_vault", proposal.key().as_ref()],
        bump,
        token::mint = collateral_mint,
        token::authority = proposal,
    )]
    pub bond_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = proposer,
    )]
    pub proposer_collateral: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[inline(never)]
fn pull_bond<'info>(
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

pub fn propose(
    ctx: Context<Propose>,
    outcome: ProposedOutcome,
    bond_amount: u64,
    challenge_window_secs: Option<i64>,
) -> Result<()> {
    require!(bond_amount > 0, OracleError::ZeroAmount);
    require!(
        outcome != ProposedOutcome::Pending,
        OracleError::InvalidOutcome,
    );

    pull_bond(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.proposer_collateral.to_account_info(),
        ctx.accounts.bond_vault.to_account_info(),
        ctx.accounts.proposer.to_account_info(),
        bond_amount,
    )?;

    let now = Clock::get()?.unix_timestamp;
    let window = challenge_window_secs.unwrap_or(DEFAULT_CHALLENGE_WINDOW_SECS);

    let p = &mut ctx.accounts.proposal;
    p.market = ctx.accounts.market.key();
    p.collateral_mint = ctx.accounts.collateral_mint.key();
    p.bond_vault = ctx.accounts.bond_vault.key();
    p.proposer = ctx.accounts.proposer.key();
    p.proposed_outcome = outcome;
    p.proposer_bond = bond_amount;
    p.challenger = Pubkey::default();
    p.challenger_outcome = ProposedOutcome::Pending;
    p.challenger_bond = 0;
    p.challenge_window_end = now.saturating_add(window);
    p.state = ProposalState::Proposed;
    p.final_outcome = ProposedOutcome::Pending;
    p.bump = ctx.bumps.proposal;
    p.bond_vault_bump = ctx.bumps.bond_vault;

    msg!(
        "arena:oracle:propose outcome={:?} bond={} window_end={}",
        outcome,
        bond_amount,
        p.challenge_window_end
    );
    Ok(())
}
