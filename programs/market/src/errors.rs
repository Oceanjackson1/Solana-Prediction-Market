use anchor_lang::prelude::*;

#[error_code]
pub enum MarketError {
    #[msg("market is not open for trading")]
    MarketNotOpen,
    #[msg("market has not closed yet")]
    MarketNotClosed,
    #[msg("market is not in resolving state")]
    NotResolving,
    #[msg("close timestamp must be in the future")]
    InvalidCloseTs,
    #[msg("resolve timestamp must be after close timestamp")]
    InvalidResolveTs,
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("question string too long")]
    QuestionTooLong,
    #[msg("slug string too long")]
    SlugTooLong,
    #[msg("outcome already set")]
    OutcomeAlreadySet,
    #[msg("math overflow")]
    MathOverflow,
    #[msg("price must be strictly between 0 and 1 (0 < price < UNIT)")]
    InvalidPrice,
    #[msg("order side mismatch for taker")]
    SideMismatch,
    #[msg("fill amount exceeds remaining order size")]
    FillExceedsRemaining,
    #[msg("taker price is worse than maker price")]
    PriceNotAccepted,
    #[msg("order is empty")]
    OrderEmpty,
}
