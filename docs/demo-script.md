# Arena — 3-Minute Demo Script

> Colosseum Frontier hackathon submission. Target length: **~3:00**. Shoot in 1080p, split-screen (browser left, narration card right).

## Pre-flight checklist

Run once before recording:

```bash
# Terminal A — localnet validator
cd "arena-ugc-market"
solana-test-validator --reset

# Terminal B — deploy
source ~/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
anchor build && anchor deploy --provider.cluster localnet

# Terminal C — frontend
cd app
cp .env.local.example .env.local
# edit .env.local to add ANTHROPIC_API_KEY
pnpm dev
```

Browser setup:
- Chrome window 1280×800
- Two Phantom accounts loaded, each funded with mock USDC (via `scripts/airdrop-usdc.sh` — create if missing; or call `createMint`+`mintTo` in a helper script)
- Default Phantom network: **Localnet** (custom RPC `http://127.0.0.1:8899`)

## Shot list

### 00:00–00:15 — Hook
> "Polymarket has 200 markets. Reality has 200,000. Argentina vs Wolves? El Clásico over 2.5 goals? Your neighborhood mayoral race? None of them. Because the cold-start problem kills long-tail prediction markets — no liquidity, no traders, no market. **Arena fixes that on Solana.**"

Visual: Arena home page. Zoom on "Prediction markets for the long tail."

### 00:15–00:45 — AI Copilot creates a market
Visual: click "Open a market →" → /create
- Type in Copilot panel: *"will argentina win the 2026 world cup"*
- Click **Generate spec** (thinking spinner)
- Spec card appears: question, resolution criteria, category, tags
- Click **Use this spec ↓** — form populates
- Click **Create market** — Phantom pops, sign
- Redirect to /markets/[id]

> "Step one: anyone can open a market. Type a natural-language question, Claude turns it into a concrete YES/NO market with resolution criteria — one click, one signature."

### 00:45–01:30 — Vault backstop (the differentiation)
Visual: order book is empty
- Click **Vault liquidity →** in header pill
- On /vault/[market], type 1000 USDC → **Initialize & seed**
- Three sequential txs (init pool → mint complete set → provide liquidity) — show each confirmation
- Dashboard now shows: USDC=0, YES=1000, NO=1000, implied YES=0.500, vLP=2000

> "Step two: the vault. I seed 1000 USDC of liquidity, which gets converted into matched YES and NO reserves. This is a constant-product AMM — Gnosis FPMM style — that backstops the market when the order book is thin."

Back to /markets/[id]:
- Vault trade panel now visible with "implied YES = 0.500"
- Enter 50 USDC in VaultTrade → live quote "receive ≈47.48 YES"
- Click **Market buy via vault**
- Vault panel refreshes: implied YES = 0.477

> "A taker shows up wanting 50 USDC of YES. Order book is empty — but the vault fills it instantly at the AMM price. No waiting for counterparty. This is the cold-start solution."

### 01:30–02:00 — CLOB limit orders
Visual: switch to second Phantom account
- Place limit **SellYes @ 0.65** for 20 YES → appears in asks ladder
- Switch back to first account → Market buy 10 USDC → limit fill first, vault fill remainder (two ix in one tx)

> "And when traders *do* show up, they get better prices. The CLOB sits on top of the vault — limit orders fill first, vault only backstops the remainder. Takers get one tx, best execution, atomic."

### 02:00–02:30 — Optimistic settlement
Visual: terminal → advance clock (or use a market with close_ts=now-60)
- Run `scripts/demo-settle.sh` (or manually call `oracle.propose(YES, 20 USDC bond, 2s window)` + wait + `oracle.finalize()` + `market.settle()` via a dev page)
- Refresh market page: header badge flips from "Open" to "Resolved · YES"
- YES holder clicks **Redeem winning** (UI stretch goal — terminal fallback: `market.redeemWinning(30 YES)` call)
- USDC balance in header jumps +30

> "When the event resolves, anyone stakes a bond proposing the outcome. 72-hour challenge window. Unchallenged? Bond refunded, market settles. Winning token holders burn YES 1-for-1 for USDC. Done."

### 02:30–03:00 — Close + ask
Visual: back to home, cards now show volume, vault dashboard shows accumulated fees

> "Three programs on Solana: market, vault, oracle. Anchor, SPL-Token, Token-2022. 15 passing tests. Next.js 16 + Phantom Connect frontend. Claude Opus 4.7 for market-spec generation. Built in 22 days for Colosseum Frontier."
>
> "Arena: open any market, the vault covers the rest. Links, GitHub, and contact in the submission."

## Cue card for voiceover

- Don't say "blockchain" more than once.
- Say "long-tail" early and twice.
- Show timestamps on-chain tx signatures briefly — judges check.
- If anything fails live, cut to the pre-recorded happy-path clip at that beat (keep 3 backup takes per segment).

## Fallback order for cuts

If time is tight, cut in this order:
1. Second Phantom account CLOB limit demo (keep only one taker)
2. Redeem winning UX (show resolved state, skip the burn tx)
3. Extended Copilot panel (show final spec card only)

Never cut: (a) Copilot one-click, (b) empty-book vault fill, (c) resolved badge.
