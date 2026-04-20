/**
 * Walk the oracle settlement flow on a cached market:
 *   propose(YES, 20 USDC bond, 4s window) → wait 5s → finalize → market.settle
 *
 * Usage:
 *   pnpm exec tsx scripts/demo-settle.ts [yes|no|invalid]
 *
 * Defaults to YES. Requires scripts/demo-seed.ts to have run first.
 */
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  defaultKeypair,
  makeProvider,
  loadPrograms,
  proposalPdas,
  readMarketCache,
  readOrCreateUsdcMintCache,
  UNIT,
} from "./_common";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const outcomeArg = (process.argv[2] ?? "yes").toLowerCase();
  const outcomeKey =
    outcomeArg === "yes"
      ? ({ yes: {} } as never)
      : outcomeArg === "no"
        ? ({ no: {} } as never)
        : outcomeArg === "invalid"
          ? ({ invalid: {} } as never)
          : null;
  if (!outcomeKey) {
    console.error("usage: tsx scripts/demo-settle.ts [yes|no|invalid]");
    process.exit(1);
  }

  const market = readMarketCache();
  if (!market) {
    console.error("no cached market — run demo-seed.ts first");
    process.exit(1);
  }
  const usdcMint = readOrCreateUsdcMintCache();
  if (!usdcMint) throw new Error("no usdc mint cached");

  const payer = defaultKeypair();
  const provider = makeProvider(payer);
  const programs = loadPrograms(provider);
  const conn = provider.connection;

  const { proposal, bondVault } = proposalPdas(programs, market);

  // Make sure proposer has USDC to stake.
  const payerUsdc = await getOrCreateAssociatedTokenAccount(
    conn,
    payer,
    usdcMint,
    payer.publicKey,
  );
  await mintTo(
    conn,
    payer,
    usdcMint,
    payerUsdc.address,
    payer,
    BigInt(50 * UNIT),
  );

  console.log(`▸ propose(outcome=${outcomeArg}, bond=20 USDC, window=4s)`);
  console.log(`  proposal: ${proposal.toBase58()}`);
  await programs.oracle.methods
    .propose(outcomeKey, new BN(20 * UNIT), new BN(4))
    .accounts({
      proposer: payer.publicKey,
      market,
      collateralMint: usdcMint,
      proposal,
      bondVault,
      proposerCollateral: payerUsdc.address,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log("▸ sleeping 5s to pass the challenge window…");
  await sleep(5500);

  console.log("▸ finalize()");
  await programs.oracle.methods
    .finalize()
    .accounts({
      caller: payer.publicKey,
      collateralMint: usdcMint,
      proposal,
      bondVault,
      proposer: payer.publicKey,
      proposerCollateral: payerUsdc.address,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("▸ market.settle()");
  await programs.market.methods
    .settle()
    .accounts({
      caller: payer.publicKey,
      market,
      proposal,
    })
    .rpc();

  const m = await programs.market.account.market.fetch(market);
  console.log("");
  console.log("✅ market resolved");
  console.log(`   state:   ${JSON.stringify(m.state)}`);
  console.log(`   outcome: ${JSON.stringify(m.outcome)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
