import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { expect } from "chai";
import type { Market } from "../target/types/market";
import type { Vault } from "../target/types/vault";

const toBytes = (s: string) => Buffer.from(s, "utf8");
const UNIT = 1_000_000;

describe("arena:vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const market = anchor.workspace.Market as Program<Market>;
  const vault = anchor.workspace.Vault as Program<Vault>;
  const payer = (provider.wallet as anchor.Wallet).payer;

  const creator = Keypair.generate();
  const admin = Keypair.generate();
  const trader = Keypair.generate();
  const slug = "v-" + Math.floor(Math.random() * 1e9).toString(36);

  let usdcMint: PublicKey;
  let marketPda: PublicKey;
  let yesMintPda: PublicKey;
  let noMintPda: PublicKey;
  let collateralVaultPda: PublicKey;
  let askVaultPda: PublicKey;
  let poolPda: PublicKey;
  let lpMintPda: PublicKey;
  let usdcVaultPda: PublicKey;
  let yesReservesPda: PublicKey;
  let noReservesPda: PublicKey;

  async function airdrop(kp: Keypair) {
    const sig = await provider.connection.requestAirdrop(
      kp.publicKey,
      2 * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }
  async function mintUsdcTo(owner: PublicKey, amount: number) {
    const ata = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcMint,
      owner,
    );
    await mintTo(
      provider.connection,
      payer,
      usdcMint,
      ata.address,
      payer,
      amount,
    );
    return ata.address;
  }

  before(async () => {
    for (const kp of [creator, admin, trader]) await airdrop(kp);
    usdcMint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      6,
    );

    [marketPda] = PublicKey.findProgramAddressSync(
      [toBytes("market"), creator.publicKey.toBuffer(), toBytes(slug)],
      market.programId,
    );
    [yesMintPda] = PublicKey.findProgramAddressSync(
      [toBytes("yes_mint"), marketPda.toBuffer()],
      market.programId,
    );
    [noMintPda] = PublicKey.findProgramAddressSync(
      [toBytes("no_mint"), marketPda.toBuffer()],
      market.programId,
    );
    [collateralVaultPda] = PublicKey.findProgramAddressSync(
      [toBytes("vault"), marketPda.toBuffer()],
      market.programId,
    );
    [askVaultPda] = PublicKey.findProgramAddressSync(
      [toBytes("ask_vault"), marketPda.toBuffer()],
      market.programId,
    );

    // Create the market.
    const now = Math.floor(Date.now() / 1000);
    await market.methods
      .createMarket({
        slug,
        question: "Vault test",
        closeTs: new BN(now + 60 * 60 * 24 * 10),
        resolveTs: new BN(now + 60 * 60 * 24 * 11),
      })
      .accounts({
        creator: creator.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        collateralVault: collateralVaultPda,
        askVault: askVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    [poolPda] = PublicKey.findProgramAddressSync(
      [toBytes("pool"), marketPda.toBuffer(), admin.publicKey.toBuffer()],
      vault.programId,
    );
    [lpMintPda] = PublicKey.findProgramAddressSync(
      [toBytes("lp_mint"), poolPda.toBuffer()],
      vault.programId,
    );
    [usdcVaultPda] = PublicKey.findProgramAddressSync(
      [toBytes("usdc_vault"), poolPda.toBuffer()],
      vault.programId,
    );
    [yesReservesPda] = PublicKey.findProgramAddressSync(
      [toBytes("yes_reserves"), poolPda.toBuffer()],
      vault.programId,
    );
    [noReservesPda] = PublicKey.findProgramAddressSync(
      [toBytes("no_reserves"), poolPda.toBuffer()],
      vault.programId,
    );
  });

  it("initializes a pool", async () => {
    await vault.methods
      .initializePool()
      .accounts({
        admin: admin.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        pool: poolPda,
        lpMint: lpMintPda,
        usdcVault: usdcVaultPda,
        yesReserves: yesReservesPda,
        noReserves: noReservesPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc();

    const p = await vault.account.pool.fetch(poolPda);
    expect(p.market.toBase58()).to.eq(marketPda.toBase58());
    expect(p.admin.toBase58()).to.eq(admin.publicKey.toBase58());
    expect(p.lpSupply.toNumber()).to.eq(0);
  });

  it("admin seeds pool with 1000 YES + 1000 NO + 0 USDC", async () => {
    // Admin first mints a complete set so they have 1000 YES + 1000 NO.
    await mintUsdcTo(admin.publicKey, 2000 * UNIT);
    const adminUsdc = getAssociatedTokenAddressSync(usdcMint, admin.publicKey);
    const adminYes = getAssociatedTokenAddressSync(yesMintPda, admin.publicKey);
    const adminNo = getAssociatedTokenAddressSync(noMintPda, admin.publicKey);
    await market.methods
      .mintCompleteSet(new BN(1000 * UNIT))
      .accounts({
        user: admin.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        collateralVault: collateralVaultPda,
        userCollateral: adminUsdc,
        userYes: adminYes,
        userNo: adminNo,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc();

    const adminLp = getAssociatedTokenAddressSync(lpMintPda, admin.publicKey);
    await vault.methods
      .provideLiquidity(new BN(0), new BN(1000 * UNIT), new BN(1000 * UNIT))
      .accounts({
        provider: admin.publicKey,
        pool: poolPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        lpMint: lpMintPda,
        usdcVault: usdcVaultPda,
        yesReserves: yesReservesPda,
        noReserves: noReservesPda,
        providerUsdc: adminUsdc,
        providerYes: adminYes,
        providerNo: adminNo,
        providerLp: adminLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc();

    const yesAcc = await getAccount(provider.connection, yesReservesPda);
    const noAcc = await getAccount(provider.connection, noReservesPda);
    const lpAcc = await getAccount(provider.connection, adminLp);
    expect(Number(yesAcc.amount)).to.eq(1000 * UNIT);
    expect(Number(noAcc.amount)).to.eq(1000 * UNIT);
    // vLP minted = 0 + 1000e6 + 1000e6 = 2000e6
    expect(Number(lpAcc.amount)).to.eq(2000 * UNIT);
  });

  it("trader swaps 50 USDC → YES via FPMM", async () => {
    await mintUsdcTo(trader.publicKey, 100 * UNIT);
    const traderUsdc = getAssociatedTokenAddressSync(usdcMint, trader.publicKey);
    const traderYes = getAssociatedTokenAddressSync(yesMintPda, trader.publicKey);

    const usdcBefore = Number(
      (await getAccount(provider.connection, traderUsdc)).amount,
    );

    await vault.methods
      .swap(true, new BN(50 * UNIT), new BN(1))
      .accounts({
        user: trader.publicKey,
        pool: poolPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        usdcVault: usdcVaultPda,
        yesReserves: yesReservesPda,
        noReserves: noReservesPda,
        userUsdc: traderUsdc,
        userYes: traderYes,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([trader])
      .rpc();

    const usdcAfter = Number(
      (await getAccount(provider.connection, traderUsdc)).amount,
    );
    const yesAfter = Number(
      (await getAccount(provider.connection, traderYes)).amount,
    );

    // Sanity checks on FPMM output. Starting R_yes=R_no=1000e6, fee=30bps.
    // usdc_after_fee = 50e6 * 9970/10000 = 49_850_000
    // new R_no = 1_049_850_000; k = 1e18; new R_yes = 1e18 / 1_049_850_000 ≈ 952_521_790
    // yes_out = 1_000_000_000 - 952_521_790 ≈ 47_478_210
    expect(usdcBefore - usdcAfter).to.eq(50 * UNIT);
    expect(yesAfter).to.be.greaterThan(46 * UNIT);
    expect(yesAfter).to.be.lessThan(49 * UNIT);

    // Vault reserves should reflect the swap.
    const yesReserveAfter = Number(
      (await getAccount(provider.connection, yesReservesPda)).amount,
    );
    const usdcVaultAfter = Number(
      (await getAccount(provider.connection, usdcVaultPda)).amount,
    );
    expect(yesReserveAfter).to.eq(1000 * UNIT - yesAfter);
    expect(usdcVaultAfter).to.eq(50 * UNIT);
  });

  it("admin withdraws 25% of LP and receives pro-rata reserves", async () => {
    const adminLp = getAssociatedTokenAddressSync(lpMintPda, admin.publicKey);
    const adminUsdc = getAssociatedTokenAddressSync(usdcMint, admin.publicKey);
    const adminYes = getAssociatedTokenAddressSync(yesMintPda, admin.publicKey);
    const adminNo = getAssociatedTokenAddressSync(noMintPda, admin.publicKey);

    const lpBefore = Number(
      (await getAccount(provider.connection, adminLp)).amount,
    );
    const usdcBefore = Number(
      (await getAccount(provider.connection, adminUsdc)).amount,
    );

    const burnAmount = Math.floor(lpBefore / 4); // 25%
    await vault.methods
      .withdraw(new BN(burnAmount))
      .accounts({
        provider: admin.publicKey,
        pool: poolPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        lpMint: lpMintPda,
        usdcVault: usdcVaultPda,
        yesReserves: yesReservesPda,
        noReserves: noReservesPda,
        providerLp: adminLp,
        providerUsdc: adminUsdc,
        providerYes: adminYes,
        providerNo: adminNo,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    const lpAfter = Number(
      (await getAccount(provider.connection, adminLp)).amount,
    );
    const usdcAfter = Number(
      (await getAccount(provider.connection, adminUsdc)).amount,
    );
    expect(lpBefore - lpAfter).to.eq(burnAmount);
    // Admin should have received ~25% of the pool's 50 USDC = ~12.5 USDC
    expect(usdcAfter - usdcBefore).to.be.greaterThan(12 * UNIT);
    expect(usdcAfter - usdcBefore).to.be.lessThan(13 * UNIT);
  });
});
