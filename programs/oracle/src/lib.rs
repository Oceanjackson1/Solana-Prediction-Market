use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::ProposedOutcome;

declare_id!("5tc1pjwjiAwPRpSNQbiP9nrrofXnLKzBfcC2SbqurM6n");

#[program]
pub mod oracle {
    use super::*;

    pub fn propose(
        ctx: Context<Propose>,
        outcome: ProposedOutcome,
        bond_amount: u64,
        challenge_window_secs: Option<i64>,
    ) -> Result<()> {
        instructions::propose::propose(ctx, outcome, bond_amount, challenge_window_secs)
    }

    pub fn challenge(
        ctx: Context<Challenge>,
        counter_outcome: ProposedOutcome,
    ) -> Result<()> {
        instructions::challenge::challenge(ctx, counter_outcome)
    }

    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        instructions::finalize::finalize(ctx)
    }
}
