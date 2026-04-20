/**
 * Mint mock USDC on the current cluster and send to a target wallet.
 *
 * Usage:
 *   pnpm exec tsx scripts/airdrop-usdc.ts <wallet_pubkey> [amount_usdc]
 *
 * First run creates a mint (the default keypair is mint authority) and caches
 * the mint address at `.arena-demo/usdc-mint.json`. Subsequent runs reuse it.
 *
 * NOTE: This is the DEMO mint. Update app/src/lib/constants.ts:USDC_MINT_DEVNET
 * to this address before running the frontend, or pass via env.
 */
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  defaultKeypair,
  makeProvider,
  readOrCreateUsdcMintCache,
  saveUsdcMintCache,
  UNIT,
} from "./_common";

async function main() {
  const [targetArg, amountArg] = process.argv.slice(2);
  if (!targetArg) {
    console.error(
      "usage: tsx scripts/airdrop-usdc.ts <wallet_pubkey> [amount_usdc=1000]",
    );
    process.exit(1);
  }
  const target = new PublicKey(targetArg);
  const amountUsdc = parseFloat(amountArg ?? "1000");
  if (!(amountUsdc > 0)) throw new Error("amount must be > 0");

  const payer = defaultKeypair();
  const provider = makeProvider(payer);
  const conn = provider.connection;

  let mint = readOrCreateUsdcMintCache();
  if (!mint) {
    console.log("▸ creating mock USDC mint (authority = payer)");
    mint = await createMint(
      conn,
      payer,
      payer.publicKey,
      null,
      6, // 6 decimals — match real USDC
    );
    saveUsdcMintCache(mint);
    console.log(`  cached mint: ${mint.toBase58()}`);
    console.log(
      `  → update app/src/lib/constants.ts USDC_MINT_DEVNET to this value`,
    );
  } else {
    console.log(`▸ using cached mint: ${mint.toBase58()}`);
  }

  console.log(`▸ ensuring ATA for ${target.toBase58()}`);
  const ata = await getOrCreateAssociatedTokenAccount(
    conn,
    payer,
    mint,
    target,
  );

  const raw = BigInt(Math.round(amountUsdc * UNIT));
  console.log(`▸ minting ${amountUsdc} USDC → ${ata.address.toBase58()}`);
  const sig = await mintTo(conn, payer, mint, ata.address, payer, raw);
  console.log(`✅ minted. tx: ${sig}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
