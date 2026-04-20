# Arena — UGC Prediction Markets on Solana

> **Open any market with an AI copilot. A Solana vault backstops thin order books so trades clear instantly — no cold-start problem.**

Colosseum **Frontier** hackathon submission. [Pitch](./docs/pitch-deck.md) · [Demo script](./docs/demo-script.md) · [Whitepaper (lite)](./docs/whitepaper-lite.md) · [Architecture](./docs/architecture.md)

---

## The problem

Polymarket runs ~200 markets. Reality has ~200,000. Argentina vs. Wolves? El Clásico over 2.5 goals? Your city's mayoral race? None of them.

Long-tail markets die in the cold-start loop: **no LP → no liquidity → no trader → no market**. Curated platforms can't bootstrap a market per interest; UGC platforms can't bootstrap traders.

## The solution

Three composable Solana programs collapse the loop:

| Pillar             | What it does                                                                                                  |
|--------------------|---------------------------------------------------------------------------------------------------------------|
| **AI Copilot**     | Natural language → structured YES/NO spec in one click. Claude Opus 4.7 with adaptive thinking.               |
| **Vault backstop** | Constant-product AMM over YES/NO reserves. Fills takers instantly even when the order book is empty.         |
| **Optimistic oracle** | Propose outcome → bond → challenge window → finalize. Any UGC event can resolve without a central arbiter. |

## Status

- **15** anchor tests passing (~25 s: `anchor test`)
- Frontend builds clean (Next.js 16 · Turbopack · 6 routes)
- Not yet deployed to mainnet. Programs run on localnet / devnet.

## Architecture

```
                        ┌──────────────────────────────┐
                        │  Next.js 16 · App Router     │
                        │  @solana/kit v6 · Phantom    │
                        │  /api/copilot → Claude 4.7   │
                        └──────────┬──────┬────────────┘
                              RPC  │      │  server-only API key
                                   ▼      ▼
┌──────────────────────────────────────────────────────────┐
│  Solana                                                   │
│                                                           │
│  ┌──────────────┐      reads      ┌─────────────┐         │
│  │   market     │◀──(manual deser)│   oracle    │         │
│  │              │   Proposal acct │             │         │
│  │  CLOB        │                 │  propose    │         │
│  │  complete-   │                 │  challenge  │         │
│  │  set mint    │                 │  finalize   │         │
│  │  settle      │                 └─────────────┘         │
│  │  redeem-     │                                         │
│  │  winning     │                                         │
│  └──────────────┘                                         │
│                                                           │
│  ┌──────────────┐                                         │
│  │    vault     │  FPMM · LP · vLP · swap · withdraw      │
│  └──────────────┘                                         │
└──────────────────────────────────────────────────────────┘
```

## Tech stack

- **On-chain**: Rust · Anchor 0.31.1 · SPL Token · 3 programs, ~1.1k LOC
- **Client**: Next.js 16 · `@solana/kit` v6 · `@coral-xyz/anchor` · `wallet-adapter` (Phantom / Solflare / Backpack)
- **AI**: Anthropic SDK · `claude-opus-4-7` · adaptive thinking · prompt caching · Zod-enforced JSON schema
- **Tests**: mocha 11 · chai · local-validator via `anchor test`

## Repository layout

```
arena-ugc-market/
├── programs/
│   ├── market/          # CLOB · complete-set · settle · redeem_winning
│   ├── vault/           # FPMM · LP · vLP · swap
│   └── oracle/          # propose · challenge · finalize
├── tests/
│   ├── market.test.ts          (6 tests)
│   ├── vault.test.ts           (4 tests)
│   └── settlement.test.ts      (5 tests)
├── app/                 # Next.js 16 frontend (6 routes)
│   └── src/
│       ├── app/
│       │   ├── page.tsx              — market list
│       │   ├── create/page.tsx       — AI copilot + create form
│       │   ├── markets/[id]/page.tsx — order book + trade + vault swap
│       │   ├── vault/[market]/page.tsx — LP dashboard
│       │   └── api/copilot/route.ts  — Claude API
│       ├── components/               — OrderBook, TradePanel, VaultTrade, RedeemWinning, Toast, …
│       └── lib/
│           ├── anchor/               — IDL, PDAs, SDK, hooks
│           ├── ai/                   — Zod schema + system prompt
│           └── format.ts, constants.ts
├── scripts/             # deploy-devnet.sh · airdrop-usdc.ts · demo-seed.ts · demo-settle.ts
└── docs/                # pitch-deck · demo-script · demo-runbook · whitepaper-lite · architecture
```

## Quickstart

```bash
# 1. Install toolchain (one-time)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
cargo install --git https://github.com/solana-foundation/anchor --tag v0.31.1 anchor-cli --locked

source ~/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana config set --url localhost   # or devnet

# 2. Build + test programs
pnpm install
anchor build
anchor test           # 15 passing in ~25 s

# 3. Run the app
cd app
cp .env.local.example .env.local     # add your ANTHROPIC_API_KEY
pnpm dev              # http://localhost:3000
```

## Demo workflow

Pre-baked scripts for the Colosseum 3-minute video (details in [docs/demo-runbook.md](./docs/demo-runbook.md)):

```bash
pnpm run deploy:devnet                              # deploy all three programs
pnpm run demo:airdrop -- <wallet> 1000              # mint mock USDC
pnpm run demo:seed    -- world-cup "Will Argentina win..."  # open market + seed vault + 2 limit orders
pnpm run demo:settle  -- yes                        # oracle → finalize → market.settle
```

## Program IDs (localnet / devnet)

| Program | ID                                             |
|---------|------------------------------------------------|
| market  | `3dphwMrHCNYzeAmeY8r6NNfdDCDrqYQQAuoDpHBZntGM` |
| vault   | `7qmi9b1z7DvDMRDhFf6nzahtCkuA5xRaesv3QphT4gQJ` |
| oracle  | `5tc1pjwjiAwPRpSNQbiP9nrrofXnLKzBfcC2SbqurM6n` |

Collateral: devnet USDC `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` ([faucet](https://spl-token-faucet.com/?token-name=USDC-Dev)), or use `scripts/airdrop-usdc.ts` to mint a mock USDC.

## What's built

- [x] D1 — Scaffold: toolchain, 3 program stubs, wallet-connect home
- [x] D2–D3 — `market.create_market` + `mint_complete_set` + `redeem_complete_set`
- [x] D4–D6 — CLOB `place_order` / `cancel_order` / `take_order` + frontend order book + market detail
- [x] D7 — `vault` FPMM: `initialize_pool` / `provide_liquidity` / `swap` / `withdraw`
- [x] D8 — Vault frontend: `/vault/[market]` LP dashboard + live FPMM quote on market detail
- [x] D12–D14 — `oracle` propose/challenge/finalize + `market.settle` + `market.redeem_winning`
- [x] D15–D16 — Claude Opus 4.7 Copilot at `/api/copilot` (Zod schema + prompt caching + safety refusal)
- [x] D19 — UI polish: toasts, resolved banner, redeem panel, relative time, pubkey copy, skeleton, hero
- [x] D20–D21 — Pitch deck, demo script, whitepaper-lite, architecture doc, runbook, demo scripts

Stretch (accelerator scope, not in MVP):
- Oracle `Challenged` branch resolution (honest unchallenged path works end-to-end)
- Multi-fill CLOB + vault backstop in a single on-chain instruction (currently client-stitched multi-ix tx)
- Fee NAV / vLP APY visualization (fees accrue; `withdraw` already claims pro-rata)
- Helius webhook → Supabase feed / comments / likes

## Docs

- [Pitch deck](./docs/pitch-deck.md) — 10 slides + speaker notes
- [Demo script](./docs/demo-script.md) — 3-minute video shot list
- [Demo runbook](./docs/demo-runbook.md) — deploy + seed + record recipe
- [Whitepaper (lite)](./docs/whitepaper-lite.md) — mechanism design
- [Architecture](./docs/architecture.md) — PDA seeds, instruction surface, data flow

## License

MIT (code) · CC-BY-SA (docs)

---

*Built for Colosseum Frontier · 2026. Contributions welcome — open an issue first.*
