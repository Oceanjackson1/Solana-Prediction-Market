use anchor_lang::prelude::*;

/// 1.0 in USDC base units (6 decimals).
pub const UNIT: u64 = 1_000_000;
/// Default swap fee: 30 bps.
pub const DEFAULT_FEE_BPS: u16 = 30;

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub market: Pubkey,
    pub admin: Pubkey,
    pub collateral_mint: Pubkey,
    pub yes_mint: Pubkey,
    pub no_mint: Pubkey,
    pub lp_mint: Pubkey,
    pub usdc_vault: Pubkey,
    pub yes_reserves: Pubkey,
    pub no_reserves: Pubkey,
    pub lp_supply: u64,
    pub fee_bps: u16,
    pub bump: u8,
    pub lp_mint_bump: u8,
    pub usdc_vault_bump: u8,
    pub yes_reserves_bump: u8,
    pub no_reserves_bump: u8,
}
