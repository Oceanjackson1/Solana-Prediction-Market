/**
 * Bootstrap a demo market: open market → seed vault with 1000 YES + 1000 NO →
 * place a couple of limit orders so the book isn't empty in the demo.
 *
 * Requires: scripts/airdrop-usdc.ts has already run (USDC mint cached).
 * Uses the default solana keypair as creator/admin; fund it first.
 *
 * Usage:
 *   pnpm exec tsx scripts/demo-seed.ts [slug] [question]
 */
import {
  BN,
} from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  defaultKeypair,
  makeProvider,
  loadPrograms,
  marketPda,
  pdas,
  poolPdaFor,
  readOrCreateUsdcMintCache,
  saveMarketCache,
  UNIT,
} from "./_common";

async function main() {
  const [slugArg, questionArg] = process.argv.slice(2);
  const slug =
    slugArg ??
    "demo-" + Math.floor(Date.now() / 1000).toString(36);
  const question =
    questionArg ?? "Will Argentina win the FIFA World Cup 2026 final?";

  const usdcMint = readOrCreateUsdcMintCache();
  if (!usdcMint) {
    console.error(
      "no cached USDC mint — run airdrop-usdc.ts first to create one",
    );
    process.exit(1);
  }

  const payer = defaultKeypair();
  const provider = makeProvider(payer);
  const programs = loadPrograms(provider);
  const conn = provider.connection;

  // Make sure creator has some USDC to mint a complete set with.
  const creatorUsdc = await getOrCreateAssociatedTokenAccount(
    conn,
    payer,
    usdcMint,
    payer.publicKey,
  );
  await mintTo(
    conn,
    payer,
    usdcMint,
    creatorUsdc.address,
    payer,
    BigInt(5000 * UNIT),
  );

  const market = marketPda(programs, payer.publicKey, slug);
  const p = pdas(programs, market);

  console.log(`▸ creating market slug=${slug}`);
  console.log(`  market pda: ${market.toBase58()}`);

  const now = Math.floor(Date.now() / 1000);
  await programs.market.methods
    .createMarket({
      slug,
      question,
      closeTs: new BN(now + 60 * 60 * 24 * 30),
      resolveTs: new BN(now + 60 * 60 * 24 * 31),
    })
    .accounts({
      creator: payer.publicKey,
      market,
      collateralMint: usdcMint,
      yesMint: p.yesMint,
      noMint: p.noMint,
      collateralVault: p.collateralVault,
      askVault: p.askVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
  saveMarketCache(market, slug);

  // Mint complete set: creator needs YES + NO to seed vault.
  const creatorYes = getAssociatedTokenAddressSync(p.yesMint, payer.publicKey);
  const creatorNo = getAssociatedTokenAddressSync(p.noMint, payer.publicKey);
  console.log("▸ minting complete set of 1000 YES + 1000 NO for vault seed");
  await programs.market.methods
    .mintCompleteSet(new BN(1000 * UNIT))
    .accounts({
      user: payer.publicKey,
      market,
      collateralMint: usdcMint,
      yesMint: p.yesMint,
      noMint: p.noMint,
      collateralVault: p.collateralVault,
      userCollateral: creatorUsdc.address,
      userYes: creatorYes,
      userNo: creatorNo,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  // Vault pool: init + provide liquidity.
  const v = poolPdaFor(programs, market, payer.publicKey);
  console.log(`▸ initializing vault pool: ${v.pool.toBase58()}`);
  await programs.vault.methods
    .initializePool()
    .accounts({
      admin: payer.publicKey,
      market,
      collateralMint: usdcMint,
      yesMint: p.yesMint,
      noMint: p.noMint,
      pool: v.pool,
      lpMint: v.lpMint,
      usdcVault: v.usdcVault,
      yesReserves: v.yesReserves,
      noReserves: v.noReserves,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  const creatorLp = getAssociatedTokenAddressSync(v.lpMint, payer.publicKey);
  console.log("▸ provide_liquidity(0 USDC, 1000 YES, 1000 NO)");
  await programs.vault.methods
    .provideLiquidity(new BN(0), new BN(1000 * UNIT), new BN(1000 * UNIT))
    .accounts({
      provider: payer.publicKey,
      pool: v.pool,
      collateralMint: usdcMint,
      yesMint: p.yesMint,
      noMint: p.noMint,
      lpMint: v.lpMint,
      usdcVault: v.usdcVault,
      yesReserves: v.yesReserves,
      noReserves: v.noReserves,
      providerUsdc: creatorUsdc.address,
      providerYes: creatorYes,
      providerNo: creatorNo,
      providerLp: creatorLp,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  // Sprinkle two limit orders so the order book renders with depth.
  console.log("▸ seeding order book: BuyYes @ 0.55 × 10 YES");
  await placeOrder({
    programs,
    payer,
    market,
    p,
    collateralMint: usdcMint,
    side: "BuyYes",
    price: 0.55,
    amountYes: 10,
    nonce: 1,
  });
  console.log("▸ seeding order book: SellYes @ 0.65 × 10 YES");
  await placeOrder({
    programs,
    payer,
    market,
    p,
    collateralMint: usdcMint,
    side: "SellYes",
    price: 0.65,
    amountYes: 10,
    nonce: 2,
  });

  console.log("");
  console.log("✅ demo market ready");
  console.log(`   slug:      ${slug}`);
  console.log(`   market:    ${market.toBase58()}`);
  console.log(`   pool:      ${v.pool.toBase58()}`);
  console.log(`   open URL:  /markets/${market.toBase58()}`);
}

async function placeOrder(args: {
  programs: ReturnType<typeof loadPrograms>;
  payer: ReturnType<typeof defaultKeypair>;
  market: PublicKey;
  p: ReturnType<typeof pdas>;
  collateralMint: PublicKey;
  side: "BuyYes" | "SellYes";
  price: number;
  amountYes: number;
  nonce: number;
}) {
  const enc = (s: string) => Buffer.from(s, "utf8");
  const nonceBn = new BN(args.nonce);
  const [order] = PublicKey.findProgramAddressSync(
    [
      enc("order"),
      args.market.toBuffer(),
      args.payer.publicKey.toBuffer(),
      nonceBn.toArrayLike(Buffer, "le", 8),
    ],
    args.programs.market.programId,
  );
  const makerUsdc = getAssociatedTokenAddressSync(
    args.collateralMint,
    args.payer.publicKey,
  );
  const makerYes = getAssociatedTokenAddressSync(
    args.p.yesMint,
    args.payer.publicKey,
  );

  await args.programs.market.methods
    .placeOrder({
      side:
        args.side === "BuyYes"
          ? ({ buyYes: {} } as never)
          : ({ sellYes: {} } as never),
      price: new BN(Math.round(args.price * UNIT)),
      amount: new BN(Math.round(args.amountYes * UNIT)),
      nonce: nonceBn,
    })
    .accounts({
      maker: args.payer.publicKey,
      market: args.market,
      collateralMint: args.collateralMint,
      yesMint: args.p.yesMint,
      collateralVault: args.p.collateralVault,
      askVault: args.p.askVault,
      order,
      makerUsdc,
      makerYes,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
