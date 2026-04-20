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

const toBytes = (s: string) => Buffer.from(s, "utf8");
const UNIT = 1_000_000;

describe("arena:market", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Market as Program<Market>;
  const payer = (provider.wallet as anchor.Wallet).payer;

  let usdcMint: PublicKey;
  const creator = Keypair.generate();
  const user = Keypair.generate();
  const taker = Keypair.generate();
  const slug = "t-" + Math.floor(Math.random() * 1e9).toString(36);

  let marketPda: PublicKey;
  let yesMintPda: PublicKey;
  let noMintPda: PublicKey;
  let vaultPda: PublicKey;
  let askVaultPda: PublicKey;

  async function airdrop(kp: Keypair, sol = 2) {
    const sig = await provider.connection.requestAirdrop(
      kp.publicKey,
      sol * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  async function fundUsdc(owner: PublicKey, amount: number) {
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
    for (const kp of [creator, user, taker]) await airdrop(kp, 2);
    usdcMint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      6,
    );

    [marketPda] = PublicKey.findProgramAddressSync(
      [toBytes("market"), creator.publicKey.toBuffer(), toBytes(slug)],
      program.programId,
    );
    [yesMintPda] = PublicKey.findProgramAddressSync(
      [toBytes("yes_mint"), marketPda.toBuffer()],
      program.programId,
    );
    [noMintPda] = PublicKey.findProgramAddressSync(
      [toBytes("no_mint"), marketPda.toBuffer()],
      program.programId,
    );
    [vaultPda] = PublicKey.findProgramAddressSync(
      [toBytes("vault"), marketPda.toBuffer()],
      program.programId,
    );
    [askVaultPda] = PublicKey.findProgramAddressSync(
      [toBytes("ask_vault"), marketPda.toBuffer()],
      program.programId,
    );
  });

  it("creates a market", async () => {
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createMarket({
        slug,
        question: "Will Argentina win the 2026 World Cup?",
        closeTs: new BN(now + 60 * 60 * 24 * 30),
        resolveTs: new BN(now + 60 * 60 * 24 * 31),
      })
      .accounts({
        creator: creator.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        collateralVault: vaultPda,
        askVault: askVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const m = await program.account.market.fetch(marketPda);
    expect(m.slug).to.eq(slug);
    expect(m.askVault.toBase58()).to.eq(askVaultPda.toBase58());
  });

  it("mints complete set for user (20 USDC → 20 YES + 20 NO)", async () => {
    await fundUsdc(user.publicKey, 100 * UNIT);
    const userUsdc = getAssociatedTokenAddressSync(usdcMint, user.publicKey);
    const userYes = getAssociatedTokenAddressSync(yesMintPda, user.publicKey);
    const userNo = getAssociatedTokenAddressSync(noMintPda, user.publicKey);

    await program.methods
      .mintCompleteSet(new BN(20 * UNIT))
      .accounts({
        user: user.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        collateralVault: vaultPda,
        userCollateral: userUsdc,
        userYes,
        userNo,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();

    const yesAcc = await getAccount(provider.connection, userYes);
    expect(Number(yesAcc.amount)).to.eq(20 * UNIT);
  });

  it("places a BuyYes limit order (price=0.6, amount=5 YES)", async () => {
    const nonce = new BN(1);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [
        toBytes("order"),
        marketPda.toBuffer(),
        user.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    );
    const userUsdc = getAssociatedTokenAddressSync(usdcMint, user.publicKey);
    const userYes = getAssociatedTokenAddressSync(yesMintPda, user.publicKey);

    await program.methods
      .placeOrder({
        side: { buyYes: {} } as never,
        price: new BN(0.6 * UNIT),
        amount: new BN(5 * UNIT),
        nonce,
      })
      .accounts({
        maker: user.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        collateralVault: vaultPda,
        askVault: askVaultPda,
        order: orderPda,
        makerUsdc: userUsdc,
        makerYes: userYes,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();

    const o = await program.account.order.fetch(orderPda);
    expect(o.remaining.toNumber()).to.eq(5 * UNIT);
    expect(o.locked.toNumber()).to.eq(3 * UNIT); // 5 * 0.6 = 3 USDC
  });

  it("taker sells 2 YES into the BuyYes order (partial fill)", async () => {
    const nonce = new BN(1);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [
        toBytes("order"),
        marketPda.toBuffer(),
        user.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    );
    // Taker needs YES tokens; give them some via complete-set mint.
    await fundUsdc(taker.publicKey, 50 * UNIT);
    const takerUsdc = getAssociatedTokenAddressSync(usdcMint, taker.publicKey);
    const takerYes = getAssociatedTokenAddressSync(yesMintPda, taker.publicKey);
    const takerNo = getAssociatedTokenAddressSync(noMintPda, taker.publicKey);
    await program.methods
      .mintCompleteSet(new BN(10 * UNIT))
      .accounts({
        user: taker.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        collateralVault: vaultPda,
        userCollateral: takerUsdc,
        userYes: takerYes,
        userNo: takerNo,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([taker])
      .rpc();

    const makerUsdc = getAssociatedTokenAddressSync(usdcMint, user.publicKey);
    const makerYes = getAssociatedTokenAddressSync(yesMintPda, user.publicKey);

    const takerYesBefore = Number(
      (await getAccount(provider.connection, takerYes)).amount,
    );
    const takerUsdcBefore = Number(
      (await getAccount(provider.connection, takerUsdc)).amount,
    );
    const makerYesBefore = Number(
      (await getAccount(provider.connection, makerYes)).amount,
    );

    await program.methods
      .takeOrder(new BN(2 * UNIT))
      .accounts({
        taker: taker.publicKey,
        maker: user.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        collateralVault: vaultPda,
        askVault: askVaultPda,
        order: orderPda,
        takerUsdc,
        takerYes,
        makerUsdc,
        makerYes,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([taker])
      .rpc();

    const takerYesAfter = Number(
      (await getAccount(provider.connection, takerYes)).amount,
    );
    const takerUsdcAfter = Number(
      (await getAccount(provider.connection, takerUsdc)).amount,
    );
    const makerYesAfter = Number(
      (await getAccount(provider.connection, makerYes)).amount,
    );

    // Taker gave 2 YES, received 1.2 USDC (2 * 0.6)
    expect(takerYesBefore - takerYesAfter).to.eq(2 * UNIT);
    expect(takerUsdcAfter - takerUsdcBefore).to.eq(1.2 * UNIT);
    // Maker received 2 YES
    expect(makerYesAfter - makerYesBefore).to.eq(2 * UNIT);

    const o = await program.account.order.fetch(orderPda);
    expect(o.remaining.toNumber()).to.eq(3 * UNIT);
    expect(o.locked.toNumber()).to.eq(1.8 * UNIT);
  });

  it("cancels the BuyYes order and refunds remaining USDC", async () => {
    const nonce = new BN(1);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [
        toBytes("order"),
        marketPda.toBuffer(),
        user.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    );
    const userUsdc = getAssociatedTokenAddressSync(usdcMint, user.publicKey);
    const userYes = getAssociatedTokenAddressSync(yesMintPda, user.publicKey);
    const usdcBefore = Number(
      (await getAccount(provider.connection, userUsdc)).amount,
    );

    await program.methods
      .cancelOrder()
      .accounts({
        maker: user.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        collateralVault: vaultPda,
        askVault: askVaultPda,
        order: orderPda,
        makerUsdc: userUsdc,
        makerYes: userYes,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const usdcAfter = Number(
      (await getAccount(provider.connection, userUsdc)).amount,
    );
    expect(usdcAfter - usdcBefore).to.eq(1.8 * UNIT);

    // Order account should be closed (rent refunded to maker).
    const closed = await provider.connection.getAccountInfo(orderPda);
    expect(closed).to.be.null;
  });

  it("places a SellYes order and takes it with USDC", async () => {
    const nonce = new BN(2);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [
        toBytes("order"),
        marketPda.toBuffer(),
        user.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    );
    const userUsdc = getAssociatedTokenAddressSync(usdcMint, user.publicKey);
    const userYes = getAssociatedTokenAddressSync(yesMintPda, user.publicKey);

    // Sell 4 YES at 0.7 USDC
    await program.methods
      .placeOrder({
        side: { sellYes: {} } as never,
        price: new BN(0.7 * UNIT),
        amount: new BN(4 * UNIT),
        nonce,
      })
      .accounts({
        maker: user.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        collateralVault: vaultPda,
        askVault: askVaultPda,
        order: orderPda,
        makerUsdc: userUsdc,
        makerYes: userYes,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();

    const o1 = await program.account.order.fetch(orderPda);
    expect(o1.locked.toNumber()).to.eq(4 * UNIT); // 4 YES locked in ask_vault

    // Taker buys 3 YES, pays 2.1 USDC
    const takerUsdc = getAssociatedTokenAddressSync(usdcMint, taker.publicKey);
    const takerYes = getAssociatedTokenAddressSync(yesMintPda, taker.publicKey);

    const takerUsdcBefore = Number(
      (await getAccount(provider.connection, takerUsdc)).amount,
    );
    const takerYesBefore = Number(
      (await getAccount(provider.connection, takerYes)).amount,
    );

    await program.methods
      .takeOrder(new BN(3 * UNIT))
      .accounts({
        taker: taker.publicKey,
        maker: user.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        collateralVault: vaultPda,
        askVault: askVaultPda,
        order: orderPda,
        takerUsdc,
        takerYes,
        makerUsdc: userUsdc,
        makerYes: userYes,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([taker])
      .rpc();

    const takerUsdcAfter = Number(
      (await getAccount(provider.connection, takerUsdc)).amount,
    );
    const takerYesAfter = Number(
      (await getAccount(provider.connection, takerYes)).amount,
    );
    expect(takerUsdcBefore - takerUsdcAfter).to.eq(2.1 * UNIT);
    expect(takerYesAfter - takerYesBefore).to.eq(3 * UNIT);

    const o2 = await program.account.order.fetch(orderPda);
    expect(o2.remaining.toNumber()).to.eq(1 * UNIT);
    expect(o2.locked.toNumber()).to.eq(1 * UNIT);
  });
});
