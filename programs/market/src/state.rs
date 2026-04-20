use anchor_lang::prelude::*;

pub const QUESTION_MAX_LEN: usize = 120;
pub const SLUG_MAX_LEN: usize = 32;
/// 1.0 in USDC base units (6 decimals). Price is always strictly between 0 and UNIT.
pub const UNIT: u64 = 1_000_000;

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub creator: Pubkey,
    pub collateral_mint: Pubkey,
    pub yes_mint: Pubkey,
    pub no_mint: Pubkey,
    pub collateral_vault: Pubkey,
    pub ask_vault: Pubkey,
    pub close_ts: i64,
    pub resolve_ts: i64,
    pub state: MarketState,
    pub outcome: Outcome,
    pub total_volume: u64,
    #[max_len(QUESTION_MAX_LEN)]
    pub question: String,
    #[max_len(SLUG_MAX_LEN)]
    pub slug: String,
    pub market_bump: u8,
    pub yes_mint_bump: u8,
    pub no_mint_bump: u8,
    pub vault_bump: u8,
    pub ask_vault_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum MarketState {
    Open,
    Closed,
    Resolving,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum Outcome {
    Pending,
    Yes,
    No,
    Invalid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum OrderSide {
    BuyYes,  // maker locks USDC, receives YES on fill
    SellYes, // maker locks YES, receives USDC on fill
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub market: Pubkey,
    pub maker: Pubkey,
    pub side: OrderSide,
    /// USDC per 1 YES, scaled by UNIT. Must satisfy 0 < price < UNIT.
    pub price: u64,
    /// YES base units remaining to fill.
    pub remaining: u64,
    /// Escrowed amount (USDC for BuyYes, YES for SellYes).
    pub locked: u64,
    pub nonce: u64,
    pub created_at: i64,
    pub bump: u8,
}

/// Compute USDC locked for a BuyYes order of `amount` YES at `price`.
pub fn cost_usdc(amount: u64, price: u64) -> Option<u64> {
    (amount as u128)
        .checked_mul(price as u128)?
        .checked_div(UNIT as u128)
        .and_then(|v| u64::try_from(v).ok())
}
