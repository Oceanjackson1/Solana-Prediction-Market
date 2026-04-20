import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import os from "os";
import type { Market } from "../target/types/market";
import type { Vault } from "../target/types/vault";
import type { Oracle } from "../target/types/oracle";
import marketIdl from "../target/idl/market.json";
import vaultIdl from "../target/idl/vault.json";
import oracleIdl from "../target/idl/oracle.json";

export const ROOT = path.resolve(__dirname, "..");
export const CACHE_DIR = path.join(ROOT, ".arena-demo");
export const USDC_MINT_PATH = path.join(CACHE_DIR, "usdc-mint.json");

fs.mkdirSync(CACHE_DIR, { recursive: true });

export const UNIT = 1_000_000;

export function loadKeypair(p: string): Keypair {
  const raw = fs.readFileSync(p, "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

export function defaultKeypair(): Keypair {
  const p = process.env.ANCHOR_WALLET ?? path.join(os.homedir(), ".config/solana/id.json");
  return loadKeypair(p);
}

export function rpcUrl(): string {
  return (
    process.env.ANCHOR_PROVIDER_URL ??
    process.env.SOLANA_RPC_URL ??
    clusterApiUrl("devnet")
  );
}

export function makeProvider(keypair = defaultKeypair()): anchor.AnchorProvider {
  const connection = new Connection(rpcUrl(), "confirmed");
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);
  return provider;
}

export function loadPrograms(provider: anchor.AnchorProvider) {
  return {
    market: new Program(marketIdl as Market, provider),
    vault: new Program(vaultIdl as Vault, provider),
    oracle: new Program(oracleIdl as Oracle, provider),
  };
}

const enc = (s: string) => Buffer.from(s, "utf8");

export function pdas(
  programs: ReturnType<typeof loadPrograms>,
  market: PublicKey,
) {
  const [yesMint] = PublicKey.findProgramAddressSync(
    [enc("yes_mint"), market.toBuffer()],
    programs.market.programId,
  );
  const [noMint] = PublicKey.findProgramAddressSync(
    [enc("no_mint"), market.toBuffer()],
    programs.market.programId,
  );
  const [collateralVault] = PublicKey.findProgramAddressSync(
    [enc("vault"), market.toBuffer()],
    programs.market.programId,
  );
  const [askVault] = PublicKey.findProgramAddressSync(
    [enc("ask_vault"), market.toBuffer()],
    programs.market.programId,
  );
  return { yesMint, noMint, collateralVault, askVault };
}

export function marketPda(
  programs: ReturnType<typeof loadPrograms>,
  creator: PublicKey,
  slug: string,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("market"), creator.toBuffer(), enc(slug)],
    programs.market.programId,
  );
  return pda;
}

export function poolPdaFor(
  programs: ReturnType<typeof loadPrograms>,
  market: PublicKey,
  admin: PublicKey,
) {
  const [pool] = PublicKey.findProgramAddressSync(
    [enc("pool"), market.toBuffer(), admin.toBuffer()],
    programs.vault.programId,
  );
  const [lpMint] = PublicKey.findProgramAddressSync(
    [enc("lp_mint"), pool.toBuffer()],
    programs.vault.programId,
  );
  const [usdcVault] = PublicKey.findProgramAddressSync(
    [enc("usdc_vault"), pool.toBuffer()],
    programs.vault.programId,
  );
  const [yesReserves] = PublicKey.findProgramAddressSync(
    [enc("yes_reserves"), pool.toBuffer()],
    programs.vault.programId,
  );
  const [noReserves] = PublicKey.findProgramAddressSync(
    [enc("no_reserves"), pool.toBuffer()],
    programs.vault.programId,
  );
  return { pool, lpMint, usdcVault, yesReserves, noReserves };
}

export function proposalPdas(
  programs: ReturnType<typeof loadPrograms>,
  market: PublicKey,
) {
  const [proposal] = PublicKey.findProgramAddressSync(
    [enc("proposal"), market.toBuffer()],
    programs.oracle.programId,
  );
  const [bondVault] = PublicKey.findProgramAddressSync(
    [enc("bond_vault"), proposal.toBuffer()],
    programs.oracle.programId,
  );
  return { proposal, bondVault };
}

export function readOrCreateUsdcMintCache(): PublicKey | null {
  if (!fs.existsSync(USDC_MINT_PATH)) return null;
  const raw = fs.readFileSync(USDC_MINT_PATH, "utf8");
  return new PublicKey(JSON.parse(raw).mint);
}

export function saveUsdcMintCache(mint: PublicKey) {
  fs.writeFileSync(
    USDC_MINT_PATH,
    JSON.stringify({ mint: mint.toBase58() }, null, 2),
  );
}

export function readMarketCache(): PublicKey | null {
  const p = path.join(CACHE_DIR, "market.json");
  if (!fs.existsSync(p)) return null;
  return new PublicKey(JSON.parse(fs.readFileSync(p, "utf8")).market);
}

export function saveMarketCache(market: PublicKey, slug: string) {
  fs.writeFileSync(
    path.join(CACHE_DIR, "market.json"),
    JSON.stringify({ market: market.toBase58(), slug }, null, 2),
  );
}
