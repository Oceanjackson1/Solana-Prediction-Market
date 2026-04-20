use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{errors::OracleError, state::*};

/// Finalize an uncontested proposal after the challenge window has closed.
/// Returns the proposer's bond. (Challenged-case arbitration is future work —
/// for MVP a challenged proposal remains in `Challenged` state.)
#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    pub collateral_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        has_one = collateral_mint,
        has_one = bond_vault,
        has_one = proposer,
        seeds = [b"proposal", proposal.market.as_ref()],
        bump = proposal.bump,
    )]
    pub proposal: Box<Account<'info, Proposal>>,

    #[account(mut, address = proposal.bond_vault)]
    pub bond_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: the original proposer. We require `has_one = proposer` on the
    /// proposal account and we transfer the bond back to their USDC ATA.
    pub proposer: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = collateral_mint,
        token::authority = proposer,
    )]
    pub proposer_collateral: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
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
    token::transfer(
        CpiContext::new_with_signer(
            token_program,
            Transfer { from, to, authority },
            signer,
        ),
        amount,
    )
}

pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
    require!(
        ctx.accounts.proposal.state == ProposalState::Proposed,
        OracleError::NotProposed
    );
    let now = Clock::get()?.unix_timestamp;
    require!(
        now >= ctx.accounts.proposal.challenge_window_end,
        OracleError::ChallengeWindowOpen
    );

    let bond = ctx.accounts.proposal.proposer_bond;
    let market = ctx.accounts.proposal.market;
    let bump = [ctx.accounts.proposal.bump];
    let seeds: &[&[u8]] = &[b"proposal", market.as_ref(), &bump];
    let signer: &[&[&[u8]]] = &[seeds];

    push(
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.bond_vault.to_account_info(),
        ctx.accounts.proposer_collateral.to_account_info(),
        ctx.accounts.proposal.to_account_info(),
        signer,
        bond,
    )?;

    let p = &mut ctx.accounts.proposal;
    p.final_outcome = p.proposed_outcome;
    p.state = ProposalState::Finalized;

    msg!(
        "arena:oracle:finalize outcome={:?} refunded={}",
        p.final_outcome,
        bond
    );
    Ok(())
}
