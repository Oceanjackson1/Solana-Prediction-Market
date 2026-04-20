use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("pool already seeded; use proportional deposit")]
    AlreadySeeded,
    #[msg("pool not yet seeded")]
    NotSeeded,
    #[msg("math overflow")]
    MathOverflow,
    #[msg("slippage: output below min_out")]
    Slippage,
    #[msg("insufficient reserve")]
    InsufficientReserve,
    #[msg("only admin allowed")]
    Unauthorized,
}
