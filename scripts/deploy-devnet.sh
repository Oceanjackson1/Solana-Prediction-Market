#!/usr/bin/env bash
# Deploy Arena programs to Solana devnet.
#
# Prereqs:
#   - rust, solana, anchor on PATH (see README Quickstart)
#   - ~/.config/solana/id.json funded with at least 5 SOL on devnet
#
# This script is idempotent-ish: re-running will redeploy (updates in place if
# the program is upgradeable) but will NOT re-generate keypairs or change IDs.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

source "$HOME/.cargo/env" 2>/dev/null || true
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ missing: $1" >&2
    exit 1
  }
}
need solana
need anchor
need cargo

echo "▸ switching solana CLI to devnet"
solana config set --url devnet >/dev/null

DEPLOYER="$(solana address)"
echo "▸ deployer: $DEPLOYER"

MIN_SOL=5
BAL=$(solana balance | awk '{print int($1)}')
echo "▸ balance: ${BAL} SOL"

if [ "$BAL" -lt "$MIN_SOL" ]; then
  echo "▸ airdropping 2 SOL (devnet faucet, retry if rate-limited)"
  for i in 1 2 3; do
    solana airdrop 2 && break
    echo "  airdrop attempt $i failed, waiting 5s…"
    sleep 5
  done
  echo "▸ post-airdrop balance: $(solana balance)"
fi

echo "▸ anchor keys sync (ensures declare_id! matches target/deploy keypairs)"
anchor keys sync

echo "▸ anchor build"
anchor build

echo "▸ anchor deploy --provider.cluster devnet"
anchor deploy --provider.cluster devnet

echo ""
echo "✅ deployed to devnet. Program IDs:"
for p in market vault oracle; do
  KP="target/deploy/${p}-keypair.json"
  if [ -f "$KP" ]; then
    ADDR=$(solana-keygen pubkey "$KP")
    printf "   %-6s  %s\n" "$p" "$ADDR"
  fi
done

echo ""
echo "Next steps:"
echo "  1. Mint mock USDC:         pnpm exec tsx scripts/airdrop-usdc.ts <wallet> <amount>"
echo "  2. Bootstrap a demo market: pnpm exec tsx scripts/demo-seed.ts"
echo "  3. Frontend:                cd app && pnpm dev"
