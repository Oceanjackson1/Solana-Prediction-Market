# Arena Whitepaper (Lite)

> A 4-page appendix for judges who want the mechanism in detail. For the pitch, see [pitch-deck.md](./pitch-deck.md).

## 1. Problem

Prediction markets work best when the underlying distribution of beliefs is thick and the outcome is crisply resolvable. Polymarket has engineered both at scale — for a narrow set of ~200 political, macro, and sports events. The long tail — local elections, niche sports, cultural outcomes ("will Apple ship glasses this year"), scientific events — is **economically uncovered** for three compound reasons:

1. **Creation bar is high.** Drafting a market means writing unambiguous resolution criteria, picking a close date, sourcing a canonical truth. Most would-be creators give up at step one.
2. **Cold start is fatal.** A new market with zero resting orders has zero price discovery and zero trading incentive. A taker arriving at an empty book leaves.
3. **Settlement is centralized.** Polymarket uses UMA; Manifold uses humans; Kalshi uses CFTC staff. Each works only because the market *set* is curated. Open UGC resolution is an unsolved interface problem.

Arena attacks (1), (2), (3) with three composable Solana programs and an AI layer.

## 2. Design goals

- **Creation in one paragraph.** Natural language → structured spec, signed on-chain.
- **Zero-depth clearing.** A taker's first trade settles against a bounded AMM even if no limit order exists.
- **Permissionless resolution.** Any market author can seed settlement; any challenger can counter.
- **Composable with Solana DeFi.** YES/NO outcome tokens are SPL tokens; LP positions are vLP tokens; vaults are PDAs. No wrapped state.

## 3. System overview

```
                          ┌──────────────────────────────┐
                          │  Next.js 16 · App Router     │
                          │  @solana/kit v6 · Phantom    │
                          │  Claude Opus 4.7 (copilot)   │
                          └──────────┬──────┬────────────┘
                                RPC  │      │  server-only
                                     ▼      ▼
  ┌─────────────────────────────────────────────────────────┐
  │  Solana runtime                                         │
  │                                                         │
  │  ┌──────────────┐       CPI         ┌─────────────┐     │
  │  │   market     │ ─── (read-only) ──│   oracle    │     │
  │  │   program    │◀──                 │   program   │     │
  │  │              │  read Proposal     │             │     │
  │  │  CLOB        │  (manual deser)    │  propose    │     │
  │  │  complete-   │                    │  challenge  │     │
  │  │  set mint    │                    │  finalize   │     │
  │  │  settle      │                    │             │     │
  │  │  redeem-     │                    │             │     │
  │  │  winning     │                    │             │     │
  │  └──────────────┘                    └─────────────┘     │
  │                                                         │
  │  ┌──────────────┐                                       │
  │  │    vault     │  FPMM · vLP · seed · swap · withdraw  │
  │  │    program   │                                       │
  │  └──────────────┘                                       │
  └─────────────────────────────────────────────────────────┘
```

## 4. Market program

### 4.1 Account model

`Market` PDA seeds = `[b"market", creator, slug]`. One account stores: creator, collateral mint, YES/NO mint PDAs, collateral_vault PDA (USDC escrow), ask_vault PDA (YES escrow for sell orders), close/resolve timestamps, state enum, outcome enum, total volume, question string (≤120 chars), slug (≤32 chars), and bumps.

`Order` PDA seeds = `[b"order", market, maker, nonce]`. Stores side (BuyYes/SellYes), price (USDC per YES × UNIT=10^6), remaining YES amount, escrowed collateral, nonce, created_at.

### 4.2 Complete set

Users deposit X USDC → market mints X YES + X NO and deposits USDC into collateral_vault. Redemption burns equal YES + NO and releases USDC. This is the entry and exit primitive for all position-taking.

### 4.3 CLOB

- `place_order(side, price, amount, nonce)` — validates price ∈ (0, UNIT); locks USDC (buy) or YES (sell) into the appropriate vault; creates the Order PDA.
- `cancel_order()` — maker-only; closes Order PDA with `close = maker` (rent refund); PDA-signed transfer of escrow back to maker ATA.
- `take_order(fill_amount)` — any taker fills ONE maker order at maker's price. Partial fills supported. Token transfers are direct between taker ATA and maker ATA for the non-escrowed side; PDA-signed vault release for the escrowed side.

Multi-fill is orchestrated by the client as a multi-instruction transaction (`take_order` × N + `vault.swap` for remainder). This keeps the on-chain account set small (stack frame ~3 KB).

### 4.4 Settlement

- `settle()` — reads the oracle's `Proposal` account by pubkey (no Anchor CPI — manual deserialize via hardcoded `ORACLE_PROGRAM_ID`). Requires `proposal.state == Finalized` and `proposal.market == market.key()`. Sets `market.outcome` from `proposal.final_outcome`, flips `market.state` to `Resolved`.
- `redeem_winning(amount)` — only when market is Resolved and outcome ∈ {Yes, No}. Burns `amount` of the winning token and transfers `amount` USDC from collateral_vault. Invalid outcomes fall back to `redeem_complete_set` (matched pair).

## 5. Vault program (FPMM)

### 5.1 Pool account

`Pool` PDA seeds = `[b"pool", market, admin]`. Multiple pools per market are allowed — discovery is client-side (`getProgramAccounts` with memcmp on the market field). Each pool stores: market pubkey, admin, three reserve ATA PDAs (USDC buffer, YES reserves, NO reserves), an LP mint PDA, LP supply, fee_bps (default 30), and bumps.

### 5.2 Lifecycle

1. **initialize_pool** — admin creates pool + LP mint + 3 ATA PDAs. All empty.
2. **provide_liquidity(usdc, yes, no)** — provider transfers assets into reserves. vLP minted = gross sum of contributions. First call bootstraps; subsequent calls should match existing ratio (MVP: honor system; future: proportional enforcement).
3. **swap(is_buy_yes, amount_in, min_out)** — user pays USDC (buy) or YES (sell) and receives the counterparty token. FPMM invariant: `R_yes · R_no = k` preserved after each swap.
4. **withdraw(vlp_amount)** — burn vLP, receive pro-rata slice of (USDC, YES, NO).

### 5.3 FPMM math

USDC is treated as a counterparty-leg reserve — buying YES folds taker's USDC into R_no, then takes YES out such that k is preserved:

```
fee_fraction    = 1 − fee_bps/10_000
usdc_after_fee  = usdc_in × fee_fraction
new_R_no        = R_no + usdc_after_fee
new_R_yes       = R_yes · R_no / new_R_no
yes_out         = R_yes − new_R_yes
```

Sell YES is symmetric. Implementation uses `u128` arithmetic throughout; all operations are `checked_mul`/`checked_div` with overflow returned as `MathOverflow`.

### 5.4 Implied price

Implied YES price = `R_no / (R_yes + R_no)`. At seed balance (R_yes = R_no), price = 0.5 — the vault starts neutral.

## 6. Oracle program

### 6.1 Optimistic flow

`Proposal` PDA seeds = `[b"proposal", market]`. One proposal per market.

1. **propose(outcome, bond_amount, challenge_window_secs?)** — proposer stakes USDC into a per-proposal `bond_vault` PDA. Sets `challenge_window_end = now + window` (default 10s for demos; production = 72 hours). State → `Proposed`.
2. **challenge(counter_outcome)** — must differ from proposed_outcome; must be inside window. Challenger stakes a matching bond. State → `Challenged`. (MVP parks here; future: veToken flow vote.)
3. **finalize()** — only if state = `Proposed` and now ≥ window_end. Proposer bond refunded; state → `Finalized`; `final_outcome = proposed_outcome`.

### 6.2 Game theory (sketch)

- Honest proposer with correct outcome faces zero slashing expected value in the unchallenged branch; refund + optional reward.
- Challenger faces loss in expectation iff the proposer is honest; gain iff the proposer is wrong. This requires the arbitration step (not in MVP) to assign final_outcome.
- At equilibrium with a functioning vote, the bond size determines the cost of dispute, not the probability of resolution error.

## 7. AI Copilot (server-side)

Next.js route handler `/api/copilot` (Node runtime):

```
POST /api/copilot
{ prompt: string, sourceUrl?: string }
→ { spec: MarketSpec, usage: {...} }
```

Implementation:
- `@anthropic-ai/sdk` v0.50+; model = `claude-opus-4-7`; `thinking: { type: "adaptive" }`.
- System prompt (≈1.3K tokens) is `cache_control: ephemeral` — second request onward reads cache at ~10% cost.
- Output shape enforced via `output_config.format: { type: "json_schema", schema: {...} }`; response is JSON-parsed and Zod-validated.
- Safety layer: prompt instructs the model to set `safetyFlag: "unsafe"` for harm-targeted / CSAM / extremist prompts. UI branches on the flag and renders a refusal card instead of populating the form.

### 7.1 Few-shot examples

Three examples in the system prompt:
1. Sports: Argentina 2026 World Cup — routine path, full schema.
2. Concept: AGI by 2028 — scalar-to-threshold rewrite, date reasoning.
3. Unsafe: death of a named individual — refusal with reason.

## 8. Security posture

- **PDA signing everywhere** — no account rent can be drained without the program's seeds.
- **Arithmetic** — all monetary paths use `u128` + checked ops.
- **Stack frames** — large CPIs extracted into `#[inline(never)]` helpers; heavy accounts boxed (`Box<Account<..>>`). Learned during D2–D3 debugging of a BPF stack-frame-5 overflow.
- **Cross-program account reads** — market.settle deserializes oracle's Proposal manually against a hardcoded programId instead of adding a crate-level dependency. Trade: slightly brittle if oracle account layout changes; gain: fully decoupled build.
- **AI safety** — server-only API key; refusal branch handled before form population; Claude's prompt-level safety + JSON schema enforcement in series.

Known MVP gaps (accelerator scope):
- Oracle Challenged branch unresolved (needs vote or admin arbitration)
- Multi-fill CLOB + vault backstop in a single on-chain instruction (currently client-stitched)
- Fee accrual is visible in LP pro-rata withdraw but not surfaced as per-epoch APY
- No rate limits / abuse controls on /api/copilot

## 9. Deployment

- Programs: localnet + devnet (not yet mainnet). Program IDs:
  - market  `3dphwMrHCNYzeAmeY8r6NNfdDCDrqYQQAuoDpHBZntGM`
  - vault   `7qmi9b1z7DvDMRDhFf6nzahtCkuA5xRaesv3QphT4gQJ`
  - oracle  `5tc1pjwjiAwPRpSNQbiP9nrrofXnLKzBfcC2SbqurM6n`
- Frontend: Vercel-deployable; set `NEXT_PUBLIC_SOLANA_RPC_URL` and server `ANTHROPIC_API_KEY`.
- Collateral: devnet USDC `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.

## 10. Licensing

MIT (code) + CC-BY-SA (this doc).
