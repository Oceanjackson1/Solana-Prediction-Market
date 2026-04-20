# Arena — System Architecture

This doc is for engineers auditing the build. For mechanism design, see [whitepaper-lite.md](./whitepaper-lite.md).

## Repository layout

```
arena-ugc-market/
├── Anchor.toml                        # cluster: localnet (test) / devnet
├── Cargo.toml                         # workspace; excludes app/
├── package.json                       # test runner (ts-mocha + chai)
├── programs/
│   ├── market/                        # CLOB + complete-set + settle + redeem_winning
│   ├── vault/                         # FPMM · LP · vLP · swap
│   └── oracle/                        # optimistic propose / challenge / finalize
├── tests/
│   ├── market.test.ts                 # 6 tests: create / mint / CLOB
│   ├── vault.test.ts                  # 4 tests: init / seed / swap / withdraw
│   └── settlement.test.ts             # 5 tests: propose → finalize → settle → redeem
├── app/                               # Next.js 16 App Router frontend
│   ├── src/app/
│   │   ├── page.tsx                   # home (market list)
│   │   ├── create/page.tsx            # Copilot + create form
│   │   ├── markets/[id]/page.tsx      # detail (book + panels)
│   │   ├── vault/[market]/page.tsx    # LP dashboard
│   │   └── api/copilot/route.ts       # Claude Opus 4.7
│   ├── src/components/                # WalletProviders, OrderBook, TradePanel, VaultTrade, CopilotPanel, …
│   └── src/lib/
│       ├── anchor/                    # IDL, PDAs, SDK helpers (market + vault)
│       ├── ai/                        # schema + system prompt
│       └── constants.ts
└── docs/
    ├── architecture.md                # ← you are here
    ├── demo-script.md                 # 3-min walkthrough
    ├── whitepaper-lite.md             # mechanism design
    └── pitch-deck.md                  # 10 slides
```

## Program IDs

| Program | Pubkey                                         |
|---------|------------------------------------------------|
| market  | `3dphwMrHCNYzeAmeY8r6NNfdDCDrqYQQAuoDpHBZntGM` |
| vault   | `7qmi9b1z7DvDMRDhFf6nzahtCkuA5xRaesv3QphT4gQJ` |
| oracle  | `5tc1pjwjiAwPRpSNQbiP9nrrofXnLKzBfcC2SbqurM6n` |

## Data flow — happy path

```
User  ─────────────────────────────────────────────────────────────────────────
 │
 │  [1] open market
 │     /create → Copilot API → Claude Opus 4.7 → JSON spec → form
 │     → market.create_market(slug, q, close_ts, resolve_ts)
 │     → creates Market PDA, YES mint PDA, NO mint PDA, collateral_vault, ask_vault
 │
 │  [2] bootstrap vault
 │     /vault/[market] → vault.initialize_pool → market.mint_complete_set
 │     → vault.provide_liquidity(0, amount_yes, amount_no)
 │     → vLP minted to LP
 │
 │  [3] taker trades (empty book)
 │     /markets/[id] → vault.swap(is_buy_yes, usdc_in, 1)
 │     → USDC into pool.usdc_vault, YES out of pool.yes_reserves
 │
 │  [4] maker places limit
 │     market.place_order(side, price, amount, nonce)
 │     → Order PDA, escrow into collateral_vault (buy) or ask_vault (sell)
 │
 │  [5] taker crosses book
 │     market.take_order(order, fill_amount) × N  +  vault.swap(remainder)
 │     all in one Transaction
 │
 │  [6] close + propose
 │     oracle.propose(outcome, bond) → Proposal PDA + bond_vault PDA
 │     (72h challenge window)
 │
 │  [7] finalize
 │     oracle.finalize() → bond refunded, state=Finalized
 │
 │  [8] settle market
 │     market.settle() reads oracle.Proposal (manual deser) → market.state=Resolved
 │
 │  [9] payout
 │     market.redeem_winning(amount) → burns winning token, 1:1 USDC out
 ▼
USDC wallet
```

## PDA seed catalog

### market program
```
Market           [b"market", creator, slug]
yes_mint         [b"yes_mint", market]
no_mint          [b"no_mint", market]
collateral_vault [b"vault", market]
ask_vault        [b"ask_vault", market]
Order            [b"order", market, maker, nonce_le_u64]
```

### vault program
```
Pool             [b"pool", market, admin]
lp_mint          [b"lp_mint", pool]
usdc_vault       [b"usdc_vault", pool]
yes_reserves     [b"yes_reserves", pool]
no_reserves      [b"no_reserves", pool]
```

### oracle program
```
Proposal         [b"proposal", market]
bond_vault       [b"bond_vault", proposal]
```

## Instruction surface

### market
| ix                  | signer        | effects                                                    |
|---------------------|---------------|------------------------------------------------------------|
| create_market       | creator       | Init Market, YES/NO mints, collateral + ask vaults         |
| mint_complete_set   | user          | USDC→vault, mint equal YES + NO                            |
| redeem_complete_set | user          | Burn YES + NO, release USDC                                |
| place_order         | maker         | Lock escrow, create Order PDA                              |
| cancel_order        | maker         | Close Order, refund escrow                                 |
| take_order          | taker         | Fill one Order partially or fully                          |
| settle              | any           | Read finalized Proposal → Market.state=Resolved            |
| redeem_winning      | holder        | Burn winning token, 1:1 USDC                               |

### vault
| ix                 | signer   | effects                                            |
|--------------------|----------|----------------------------------------------------|
| initialize_pool    | admin    | Create Pool, LP mint, 3 reserve ATAs               |
| provide_liquidity  | provider | Transfer USDC + YES + NO in, mint vLP              |
| swap               | user     | FPMM trade USDC ↔ YES                              |
| withdraw           | LP       | Burn vLP, pro-rata (USDC, YES, NO) out             |

### oracle
| ix         | signer     | effects                                              |
|------------|------------|------------------------------------------------------|
| propose    | proposer   | Stake bond, create Proposal + bond_vault             |
| challenge  | challenger | Stake matching bond, state=Challenged                |
| finalize   | any        | If Proposed + past window: bond refunded, Finalized  |

## State enums

```rust
// market
MarketState ::= Open | Closed | Resolving | Resolved
Outcome     ::= Pending | Yes | No | Invalid
OrderSide   ::= BuyYes | SellYes

// oracle
ProposalState   ::= Proposed | Challenged | Finalized
ProposedOutcome ::= Pending | Yes | No | Invalid
```

## Test matrix

| Suite                    | Count | Runtime |
|--------------------------|-------|---------|
| `arena:market`           | 6     | ~6s     |
| `arena:vault`            | 4     | ~4s     |
| `arena:settlement`       | 5     | ~6s (sleeps for 4s challenge window) |
| **Total**                | **15**| **~25s**|

Run: `anchor test` (boots local validator, deploys, runs mocha).

## Toolchain

| Tool             | Version   | Notes                                              |
|------------------|-----------|----------------------------------------------------|
| Rust (system)    | 1.95.0    | stable-aarch64-apple-darwin                        |
| Solana CLI       | 3.1.13    | Agave client                                       |
| Anchor           | 0.31.1    | installed via `cargo install --git anchor-cli`     |
| BPF rustc        | 1.89-dev  | bundled with solana-install                        |
| Node             | 25.x      | requires mocha 11 (mocha 10 + yargs 16 breaks ESM) |
| pnpm             | 10.x      | workspace package manager                          |

## Known gotchas

- Node 25 + mocha 10 fails with `yargs` ESM/CJS interop error. Upgrade to `mocha@^11`.
- Solana BPF rustc 1.89 rejects `blake3 ≥ 1.8` (requires rustc 1.95). Pin: `cargo update -p blake3 --precise 1.5.5`.
- `#[inline(never)]` helpers take `AccountInfo<'info>` parameters rather than `&Context<..>` to avoid lifetime invariance errors; always extract AccountInfos in the caller and pass them positionally.
- Cross-program account reads from the market program to the oracle program use hardcoded `ORACLE_PROGRAM_ID` + manual `AnchorDeserialize` rather than a Rust dependency, to keep build decoupled.

## References

- [Anchor docs](https://www.anchor-lang.com/docs)
- [@solana/kit](https://github.com/anza-xyz/kit) (v6)
- [Claude API docs](https://platform.claude.com/docs/en)
- [Gnosis CTF FPMM](https://docs.gnosis.io/conditionaltokens/docs/fpmmguide1) — original vault-backstop design
