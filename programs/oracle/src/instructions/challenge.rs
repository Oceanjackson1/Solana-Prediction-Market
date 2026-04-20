use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{errors::OracleError, state::*};

#[derive(Accounts)]
pub struct Challenge<'info> {
    #[account(mut)]
    pub challenger: Signer<'info>,

    pub collateral_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        has_one = collateral_mint,
        has_one = bond_vault,
        seeds = [b"proposal", proposal.market.as_ref()],
        bump = proposal.bump,
    )]
    pub proposal: Box<Account<'info, Proposal>>,

    #[account(mut, address = proposal.bond_vault)]
    pub bond_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = challenger,
    )]
    pub challenger_collateral: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
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

pub fn challenge(ctx: Context<Challenge>, counter_outcome: ProposedOutcome) -> Result<()> {
    require!(
        ctx.accounts.proposal.state == ProposalState::Proposed,
        OracleError::NotProposed
    );
    let now = Clock::get()?.unix_timestamp;
    require!(
        now < ctx.accounts.proposal.challenge_window_end,
        OracleError::ChallengeWindowExpired
    );
    require!(
        counter_outcome != ProposedOutcome::Pending,
        OracleError::InvalidOutcome
    );
    require!(
        counter_outcome != ctx.accounts.proposal.proposed_outcome,
        OracleError::CounterOutcomeMustDiffer
    );

    let bond = ctx.accounts.proposal.proposer_bond;
    pull_bond(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.challenger_collateral.to_account_info(),
        ctx.accounts.bond_vault.to_account_info(),
        ctx.accounts.challenger.to_account_info(),
        bond,
    )?;

    let p = &mut ctx.accounts.proposal;
    p.challenger = ctx.accounts.challenger.key();
    p.challenger_outcome = counter_outcome;
    p.challenger_bond = bond;
    p.state = ProposalState::Challenged;

    msg!(
        "arena:oracle:challenge counter_outcome={:?} bond={}",
        counter_outcome,
        bond
    );
    Ok(())
}
