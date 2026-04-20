use anchor_lang::prelude::*;

#[error_code]
pub enum OracleError {
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("outcome must be Yes, No, or Invalid — not Pending")]
    InvalidOutcome,
    #[msg("proposal is not in Proposed state")]
    NotProposed,
    #[msg("proposal is not in Challenged state")]
    NotChallenged,
    #[msg("proposal must be Finalized to consume")]
    NotFinalized,
    #[msg("challenge window has expired")]
    ChallengeWindowExpired,
    #[msg("challenge window has not yet expired")]
    ChallengeWindowOpen,
    #[msg("challenger outcome must differ from proposer outcome")]
    CounterOutcomeMustDiffer,
    #[msg("math overflow")]
    MathOverflow,
}
