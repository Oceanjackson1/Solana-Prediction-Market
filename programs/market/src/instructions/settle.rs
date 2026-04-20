use anchor_lang::prelude::*;

use crate::{errors::MarketError, state::*};

/// Read-only view of the oracle program's `Proposal` layout. Mirrored here so
/// we don't have to depend on the oracle crate as a Rust dep. We only deserialize
/// the prefix we need (discriminator + fixed-size fields through `final_outcome`).
const ORACLE_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!(
    "5tc1pjwjiAwPRpSNQbiP9nrrofXnLKzBfcC2SbqurM6n"
);

#[derive(AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
enum ExternalProposedOutcome {
    Pending = 0,
    Yes = 1,
    No = 2,
    Invalid = 3,
}

#[derive(AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
enum ExternalProposalState {
    Proposed = 0,
    Challenged = 1,
    Finalized = 2,
}

#[derive(AnchorDeserialize)]
struct ExternalProposal {
    pub market: Pubkey,
    pub _collateral_mint: Pubkey,
    pub _bond_vault: Pubkey,
    pub _proposer: Pubkey,
    pub _proposed_outcome: ExternalProposedOutcome,
    pub _proposer_bond: u64,
    pub _challenger: Pubkey,
    pub _challenger_outcome: ExternalProposedOutcome,
    pub _challenger_bond: u64,
    pub _challenge_window_end: i64,
    pub state: ExternalProposalState,
    pub final_outcome: ExternalProposedOutcome,
    // remaining bumps we don't need
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"market", market.creator.as_ref(), market.slug.as_bytes()],
        bump = market.market_bump,
    )]
    pub market: Box<Account<'info, Market>>,

    /// CHECK: we verify owner == oracle program and deserialize manually to
    /// avoid a cross-crate dependency.
    pub proposal: UncheckedAccount<'info>,
}

pub fn settle(ctx: Context<Settle>) -> Result<()> {
    require!(
        ctx.accounts.market.state == MarketState::Open,
        MarketError::MarketNotOpen
    );

    // Verify proposal is owned by the oracle program.
    require_keys_eq!(
        *ctx.accounts.proposal.owner,
        ORACLE_PROGRAM_ID,
        MarketError::NotResolving
    );

    let data = ctx.accounts.proposal.try_borrow_data()?;
    require!(data.len() >= 8, MarketError::NotResolving);
    // Skip the 8-byte anchor discriminator.
    let mut slice: &[u8] = &data[8..];
    let p = ExternalProposal::deserialize(&mut slice)
        .map_err(|_| error!(MarketError::NotResolving))?;

    require!(
        p.market == ctx.accounts.market.key(),
        MarketError::NotResolving
    );
    require!(
        p.state == ExternalProposalState::Finalized,
        MarketError::NotResolving
    );

    let outcome = match p.final_outcome {
        ExternalProposedOutcome::Yes => Outcome::Yes,
        ExternalProposedOutcome::No => Outcome::No,
        ExternalProposedOutcome::Invalid => Outcome::Invalid,
        ExternalProposedOutcome::Pending => return err!(MarketError::NotResolving),
    };

    let m = &mut ctx.accounts.market;
    require!(m.outcome == Outcome::Pending, MarketError::OutcomeAlreadySet);
    m.outcome = outcome;
    m.state = MarketState::Resolved;

    msg!("arena:market:settle outcome={:?}", outcome);
    Ok(())
}
