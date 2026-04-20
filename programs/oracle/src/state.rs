use anchor_lang::prelude::*;

/// Default challenge window (seconds). Demo uses a short window so tests can
/// advance past it on localnet (validator warp). 10 seconds works for live demos.
pub const DEFAULT_CHALLENGE_WINDOW_SECS: i64 = 10;

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub market: Pubkey,
    pub collateral_mint: Pubkey,
    pub bond_vault: Pubkey,
    pub proposer: Pubkey,
    pub proposed_outcome: ProposedOutcome,
    pub proposer_bond: u64,
    pub challenger: Pubkey,
    pub challenger_outcome: ProposedOutcome,
    pub challenger_bond: u64,
    pub challenge_window_end: i64,
    pub state: ProposalState,
    pub final_outcome: ProposedOutcome,
    pub bump: u8,
    pub bond_vault_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum ProposedOutcome {
    Pending,
    Yes,
    No,
    Invalid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum ProposalState {
    Proposed,
    Challenged,
    Finalized,
}
