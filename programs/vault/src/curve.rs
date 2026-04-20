/// Constant-product (x*y=k) AMM over YES ↔ USDC legs.
///
/// For BuyYes: taker pays USDC, gets YES.
///   Δ_yes_out = R_yes - (R_yes * R_no) / (R_no + Δ_usdc_in_after_fee * (R_no_scale))
///
/// Simplification: we treat USDC as a counterparty-side reserve by
/// interpreting the pool's "virtual USDC" as the NO reserve (since in
/// prediction markets YES+NO = 1 USDC). So reserves are tracked as
/// R_yes (YES tokens held) and R_no (NO tokens held). A user buying YES
/// pays USDC → pool uses that USDC to mint complete sets OFF-CHAIN (for
/// MVP: assume admin rebalances) and treats the USDC as a direct
/// exchange into the NO leg at price 1. This keeps the math tractable
/// while preserving the intuitive "constant product over YES/NO"
/// invariant that Gnosis/Polymarket FPMMs use.

pub fn cp_buy_yes(r_yes: u128, r_no: u128, usdc_in: u128, fee_bps: u16) -> Option<u128> {
    let fee = 10_000u128 - fee_bps as u128;
    let usdc_after_fee = usdc_in.checked_mul(fee)?.checked_div(10_000)?;
    // new R_no after user's USDC is folded in as NO equivalent
    let new_r_no = r_no.checked_add(usdc_after_fee)?;
    // invariant k = r_yes * r_no; new R_yes' = k / new_r_no
    let k = r_yes.checked_mul(r_no)?;
    let new_r_yes = k.checked_div(new_r_no)?;
    r_yes.checked_sub(new_r_yes)
}

pub fn cp_sell_yes(r_yes: u128, r_no: u128, yes_in: u128, fee_bps: u16) -> Option<u128> {
    let fee = 10_000u128 - fee_bps as u128;
    let yes_after_fee = yes_in.checked_mul(fee)?.checked_div(10_000)?;
    let new_r_yes = r_yes.checked_add(yes_after_fee)?;
    let k = r_yes.checked_mul(r_no)?;
    let new_r_no = k.checked_div(new_r_yes)?;
    r_no.checked_sub(new_r_no)
}

/// Implied YES price in USDC (0..UNIT), = R_no / (R_yes + R_no) × UNIT.
pub fn implied_price_yes(r_yes: u128, r_no: u128, unit: u128) -> Option<u128> {
    let sum = r_yes.checked_add(r_no)?;
    if sum == 0 {
        return None;
    }
    r_no.checked_mul(unit)?.checked_div(sum)
}
