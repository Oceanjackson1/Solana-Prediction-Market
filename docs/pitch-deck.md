# Arena — Pitch Deck Outline (10 slides)

> Each slide is ≤30 words of on-slide copy plus a one-line speaker note. Keep visuals bold, numbers tabular, zero stock photos.

---

## Slide 1 — Title
**Arena**
*Prediction markets for the long tail, on Solana.*

Speaker: "Open any market with an AI copilot. A Solana vault backstops thin order books so trades clear instantly."

---

## Slide 2 — Problem
**The long tail is dead weight.**

- Polymarket: ~200 active markets
- Cultural + local events: ~200,000 *possible* markets
- 99.9% never open. Cold start kills them: no LPs → no liquidity → no traders → no market.

Speaker: "Every prediction market platform converges on the same 50 political events. The real demand — sports niches, culture, local — sits uncovered because nobody bootstraps the order book."

---

## Slide 3 — Solution
**AI Copilot + Vault Backstop.**

1. **AI Copilot** — natural language → structured YES/NO market spec, one click.
2. **Vault FPMM** — LP seeds once, AMM answers every order book gap.
3. **Optimistic oracle** — UGC events resolve via stake-and-challenge.

Speaker: "Three primitives collapse the cold-start problem. Opening a market is a paragraph of English. Trading a new market is instant because the vault is always at the mid. Resolving a long-tail event is a bond and a timer."

---

## Slide 4 — Demo
*Live walkthrough (3 minutes).*

Visual: embedded video / live browser.

Speaker: "Let me show you."

---

## Slide 5 — Architecture
**Three Anchor programs.**

| Program | Role                           |
|---------|--------------------------------|
| market  | CLOB + complete-set mint       |
| vault   | FPMM · LP · vLP                |
| oracle  | Optimistic propose/challenge   |

Plus: Next.js 16 App Router · @solana/kit v6 · Phantom Connect · Claude Opus 4.7.

Speaker: "Each program does one thing. The market runs the order book and mints YES/NO complete sets. The vault runs the AMM and tokenizes LP positions. The oracle runs the settlement. Composable, independently testable, 15 passing tests."

---

## Slide 6 — Why Solana
**The lego matters.**

- Sub-second finality → order book feels synchronous
- $0.0001 per tx → limit orders at retail scale viable
- SPL-Token + Token-2022 → YES/NO outcome tokens are standard, composable with any Solana DeFi
- Program derived accounts → one PDA per market, fully deterministic client state

Speaker: "On EVM this design costs $5 per order. On Solana you can run an orderbook that feels like Binance with Anchor."

---

## Slide 7 — Differentiation

|                   | Polymarket | Manifold | Buzzing | **Arena**          |
|-------------------|------------|----------|---------|--------------------|
| Chain             | EVM        | —        | EVM     | **Solana**         |
| Market creation   | Curated    | UGC      | UGC     | **UGC + AI**       |
| Cold-start fix    | —          | LMSR     | —       | **Vault backstop** |
| Matching          | CLOB       | AMM      | AMM     | **CLOB + Vault**   |
| Long-tail         | ❌         | ✅       | ✅      | **✅**             |

Speaker: "Gnosis FPMM had the vault idea but not CLOB on top. Polymarket has CLOB but not UGC. Manifold has UGC but not real money. We're the combination — with AI to lower the creation bar."

---

## Slide 8 — Tokenomics sketch
**Fees compound to LPs.**

- Taker fee: **30 bps** on vault swaps (configurable)
- vLP share of pool = pro-rata claim on (USDC, YES, NO) reserves
- As YES/NO reserves rebalance from trades, LPs capture the spread
- Future: 10% fee split to market creator, 10% to protocol treasury (MVP: 100% to LP)

Speaker: "LPs make money two ways — trading fees and pricing the counterparty side. Exactly how Uniswap LPs work, adapted to binary outcomes."

---

## Slide 9 — Roadmap

**Today (MVP):** 3 programs on devnet, frontend, AI Copilot, 15 tests.

**Accelerator Q3:**
- veToken + flow voting for challenged proposals
- Helius webhook → Supabase indexer → social feed + comments
- Multi-collateral (SOL, LST, Tokenized RWA)
- Parlay / cross-market positions
- Mobile app (Expo)

**Mainnet Q4:** permissionless markets, creator revshare, fiat ramp via Phantom Connect.

Speaker: "We're submitting the mechanism. The accelerator is about productionizing it — governance, distribution, mobile."

---

## Slide 10 — Ask

**Team:** [your name] · [role] · [link]

**GitHub:** github.com/[…]/arena-ugc-market
**Demo:** arena-demo.vercel.app (devnet)
**Contact:** [email]

Looking for: Colosseum accelerator seat · Solana Foundation compute credits · design partners (one sports DAO, one political DAO).

Speaker: "Arena is the cold-start fix for prediction markets. We want to build it with you."

---

## Appendix (linked from last slide)

- [Whitepaper-lite](./whitepaper-lite.md) — mechanism design
- [Architecture](./architecture.md) — system diagram + data flow
- [Demo script](./demo-script.md) — 3-minute walkthrough
- Test log (`anchor test` → 15 passing)
