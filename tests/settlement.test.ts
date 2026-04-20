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
import type { Oracle } from "../target/types/oracle";

const toBytes = (s: string) => Buffer.from(s, "utf8");
const UNIT = 1_000_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("arena:settlement", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const market = anchor.workspace.Market as Program<Market>;
  const oracle = anchor.workspace.Oracle as Program<Oracle>;
  const payer = (provider.wallet as anchor.Wallet).payer;

  const creator = Keypair.generate();
  const alice = Keypair.generate(); // holds YES
  const bob = Keypair.generate(); // proposes outcome
  const slug = "s-" + Math.floor(Math.random() * 1e9).toString(36);

  let usdcMint: PublicKey;
  let marketPda: PublicKey;
  let yesMintPda: PublicKey;
  let noMintPda: PublicKey;
  let collateralVaultPda: PublicKey;
  let askVaultPda: PublicKey;
  let proposalPda: PublicKey;
  let bondVaultPda: PublicKey;

  async function airdrop(kp: Keypair) {
    const sig = await provider.connection.requestAirdrop(
      kp.publicKey,
      2 * LAMPORTS_PER_SOL,
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
    for (const kp of [creator, alice, bob]) await airdrop(kp);
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
    [proposalPda] = PublicKey.findProgramAddressSync(
      [toBytes("proposal"), marketPda.toBuffer()],
      oracle.programId,
    );
    [bondVaultPda] = PublicKey.findProgramAddressSync(
      [toBytes("bond_vault"), proposalPda.toBuffer()],
      oracle.programId,
    );

    const now = Math.floor(Date.now() / 1000);
    await market.methods
      .createMarket({
        slug,
        question: "Settlement test market",
        closeTs: new BN(now + 60 * 60),
        resolveTs: new BN(now + 60 * 60 * 2),
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

    // Alice mints a complete set — she'll end up holding YES after the
    // market resolves YES, so she can redeem winnings.
    await fundUsdc(alice.publicKey, 100 * UNIT);
    const aliceUsdc = getAssociatedTokenAddressSync(usdcMint, alice.publicKey);
    const aliceYes = getAssociatedTokenAddressSync(yesMintPda, alice.publicKey);
    const aliceNo = getAssociatedTokenAddressSync(noMintPda, alice.publicKey);
    await market.methods
      .mintCompleteSet(new BN(50 * UNIT))
      .accounts({
        user: alice.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        collateralVault: collateralVaultPda,
        userCollateral: aliceUsdc,
        userYes: aliceYes,
        userNo: aliceNo,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([alice])
      .rpc();

    await fundUsdc(bob.publicKey, 100 * UNIT);
  });

  it("bob proposes YES with 20 USDC bond, 2s challenge window", async () => {
    const bobUsdc = getAssociatedTokenAddressSync(usdcMint, bob.publicKey);

    await oracle.methods
      .propose({ yes: {} } as never, new BN(20 * UNIT), new BN(2))
      .accounts({
        proposer: bob.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        proposal: proposalPda,
        bondVault: bondVaultPda,
        proposerCollateral: bobUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([bob])
      .rpc();

    const p = await oracle.account.proposal.fetch(proposalPda);
    expect(p.proposerBond.toNumber()).to.eq(20 * UNIT);

    const bondAcc = await getAccount(provider.connection, bondVaultPda);
    expect(Number(bondAcc.amount)).to.eq(20 * UNIT);
  });

  it("finalize fails while challenge window is open", async () => {
    const bobUsdc = getAssociatedTokenAddressSync(usdcMint, bob.publicKey);
    let threw = false;
    try {
      await oracle.methods
        .finalize()
        .accounts({
          caller: bob.publicKey,
          collateralMint: usdcMint,
          proposal: proposalPda,
          bondVault: bondVaultPda,
          proposer: bob.publicKey,
          proposerCollateral: bobUsdc,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bob])
        .rpc();
    } catch {
      threw = true;
    }
    expect(threw).to.eq(true);
  });

  it("after window, bob finalizes the proposal", async () => {
    await sleep(4000);
    const bobUsdc = getAssociatedTokenAddressSync(usdcMint, bob.publicKey);
    const bondBefore = Number(
      (await getAccount(provider.connection, bobUsdc)).amount,
    );

    await oracle.methods
      .finalize()
      .accounts({
        caller: bob.publicKey,
        collateralMint: usdcMint,
        proposal: proposalPda,
        bondVault: bondVaultPda,
        proposer: bob.publicKey,
        proposerCollateral: bobUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bob])
      .rpc();

    const bondAfter = Number(
      (await getAccount(provider.connection, bobUsdc)).amount,
    );
    expect(bondAfter - bondBefore).to.eq(20 * UNIT);

    const p = await oracle.account.proposal.fetch(proposalPda);
    expect("finalized" in p.state).to.eq(true);
    expect("yes" in p.finalOutcome).to.eq(true);
  });

  it("market.settle reads the finalized proposal and resolves YES", async () => {
    await market.methods
      .settle()
      .accounts({
        caller: creator.publicKey,
        market: marketPda,
        proposal: proposalPda,
      })
      .signers([creator])
      .rpc();

    const m = await market.account.market.fetch(marketPda);
    expect("resolved" in m.state).to.eq(true);
    expect("yes" in m.outcome).to.eq(true);
  });

  it("alice redeems 30 YES for 30 USDC", async () => {
    const aliceUsdc = getAssociatedTokenAddressSync(usdcMint, alice.publicKey);
    const aliceYes = getAssociatedTokenAddressSync(yesMintPda, alice.publicKey);
    const aliceNo = getAssociatedTokenAddressSync(noMintPda, alice.publicKey);

    const usdcBefore = Number(
      (await getAccount(provider.connection, aliceUsdc)).amount,
    );
    const yesBefore = Number(
      (await getAccount(provider.connection, aliceYes)).amount,
    );

    await market.methods
      .redeemWinning(new BN(30 * UNIT))
      .accounts({
        user: alice.publicKey,
        market: marketPda,
        collateralMint: usdcMint,
        yesMint: yesMintPda,
        noMint: noMintPda,
        collateralVault: collateralVaultPda,
        userCollateral: aliceUsdc,
        userYes: aliceYes,
        userNo: aliceNo,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc();

    const usdcAfter = Number(
      (await getAccount(provider.connection, aliceUsdc)).amount,
    );
    const yesAfter = Number(
      (await getAccount(provider.connection, aliceYes)).amount,
    );
    expect(usdcAfter - usdcBefore).to.eq(30 * UNIT);
    expect(yesBefore - yesAfter).to.eq(30 * UNIT);
  });
});
