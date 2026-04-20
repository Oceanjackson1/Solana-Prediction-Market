# Demo Runbook

End-to-end recipe for getting Arena onto **devnet** and running the 3-minute demo script. Target audience: you, tomorrow morning, with zero in-context memory and one hour before recording.

## 0. Prerequisites (one-time)

```bash
# Toolchain — skip if already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
cargo install --git https://github.com/solana-foundation/anchor --tag v0.31.1 anchor-cli --locked

source ~/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Funded wallet — you should already have one
# If not: solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json
solana config set --url devnet
solana airdrop 5    # may need to retry; devnet faucet is rate-limited
```

Claude API key for the Copilot route:

```bash
cd app
cp .env.local.example .env.local
# edit .env.local → ANTHROPIC_API_KEY=sk-ant-...
```

## 1. Deploy programs to devnet

```bash
cd arena-ugc-market
pnpm install
pnpm run deploy:devnet
```

Output confirms the three program IDs. They're hard-coded in `declare_id!` and `Anchor.toml` so they stay stable across redeploys.

If your deployer wallet differs from the default, redeployment will fail because the deployer is the upgrade authority on existing program accounts. Either use the original deployer keypair or deploy under fresh program keypairs (`solana-keygen new -o target/deploy/<name>-keypair.json --force` then `anchor keys sync`).

## 2. Create mock USDC + fund demo wallets

```bash
# Create the mock mint and fund the deployer
pnpm run demo:airdrop -- "$(solana address)" 10000

# Fund each Phantom account you'll use in the demo
pnpm run demo:airdrop -- <alice_phantom_pubkey> 1000
pnpm run demo:airdrop -- <bob_phantom_pubkey>   1000
```

The first run creates a new SPL mint where the deployer is the mint authority, and caches the mint address in `.arena-demo/usdc-mint.json`. Subsequent calls reuse it.

**Wire the frontend to this mint** — edit `app/src/lib/constants.ts`:

```ts
export const USDC_MINT_DEVNET = address(
  "<the pubkey printed by demo:airdrop>",
);
```

(Alternative: read the JSON at build time. For the demo, manual edit is fine.)

## 3. Bootstrap a seeded market

```bash
pnpm run demo:seed -- world-cup-2026 \
  "Will Argentina win the FIFA World Cup 2026 final?"
```

This creates:

- A Market PDA with close_ts = +30 days
- YES/NO mints, collateral + ask vaults
- 1000 USDC worth of complete-set deposited as vault seed (R_yes = R_no = 1000)
- Two limit orders: BuyYes @ 0.55 × 10 and SellYes @ 0.65 × 10

The market pubkey is cached in `.arena-demo/market.json` for the settle script.

URL to open in the demo: `http://localhost:3000/markets/<MARKET_PUBKEY>`.

## 4. Run the frontend

```bash
cd app
pnpm dev
# http://localhost:3000
```

Phantom setup:
1. Network → **Solana Devnet** (custom RPC `https://api.devnet.solana.com` works too)
2. Import/create two accounts (Alice, Bob). Confirm each shows non-zero Devnet USDC on the home page.

## 5. Record the demo

Follow [demo-script.md](./demo-script.md) beat-by-beat. Pre-flight the final "resolve" beat before recording: practice the oracle flow once so you know it works in the current RPC environment.

## 6. Resolve the market (for the settlement beat)

```bash
# YES outcome (Argentina wins the mock market)
pnpm run demo:settle -- yes

# or NO, or INVALID
pnpm run demo:settle -- no
```

This walks: `oracle.propose(outcome, 20 USDC, 4s window)` → waits 5s → `oracle.finalize()` → `market.settle()`. Browser: refresh `/markets/<pubkey>`; header badge flips to **Resolved · YES**. Alice (YES holder) can then redeem in UI or terminal.

For a manual `redeem_winning` from the CLI (not yet wired into the frontend):

```bash
# Coming soon — for now, extend demo-settle.ts with a redeem step if needed.
```

## 7. Deploy the frontend (Vercel)

```bash
cd app
vercel --prod
# Environment variables to set in Vercel dashboard:
#   NEXT_PUBLIC_SOLANA_CLUSTER=devnet
#   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
#   ANTHROPIC_API_KEY=sk-ant-...   (SERVER-ONLY, not NEXT_PUBLIC)
```

Submission URL: the vercel.app domain Vercel assigns. Include in the Colosseum form.

## Troubleshooting

| Symptom                                        | Fix                                                                 |
|------------------------------------------------|---------------------------------------------------------------------|
| `error: Account does not exist`                | Re-run `pnpm run demo:seed` — cache may be stale after a devnet reset |
| `Error: RPC request failed` / timeout           | Public devnet RPC is noisy. Use Helius or Triton instead.           |
| `Simulation failed: insufficient lamports`      | Deployer ran out of SOL. `solana airdrop 2`, retry.                 |
| Copilot returns 500                            | Missing `ANTHROPIC_API_KEY` in `app/.env.local` or Vercel env.      |
| `Invalid outcome` / mint auth errors           | USDC mint cache mismatch. Delete `.arena-demo/` and re-seed.        |
| `blake3 >= 1.8 requires rustc 1.95` on `anchor build` | `cargo update -p blake3 --precise 1.5.5`                      |

## Idempotency map

| Step                    | Re-runnable?                     | Notes                              |
|-------------------------|----------------------------------|------------------------------------|
| `deploy:devnet`         | Yes                              | Upgrades program in place          |
| `demo:airdrop`          | Yes                              | Reuses cached mint                 |
| `demo:seed`             | **No** if slug is reused         | Pick a new slug each run, or delete `.arena-demo/market.json` |
| `demo:settle`           | **No**                           | Oracle proposal PDA is one-per-market; can't re-propose after finalize |

For a clean restart: `rm -rf .arena-demo` and re-run airdrop → seed.
