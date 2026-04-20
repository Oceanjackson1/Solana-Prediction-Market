import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAccount } from "@solana/spl-token";
import type { VaultProgram } from "./vault-program";

export type PoolAccount = {
  market: PublicKey;
  admin: PublicKey;
  collateralMint: PublicKey;
  yesMint: PublicKey;
  noMint: PublicKey;
  lpMint: PublicKey;
  usdcVault: PublicKey;
  yesReserves: PublicKey;
  noReserves: PublicKey;
  lpSupply: BN;
  feeBps: number;
};

export type PoolSnapshot = {
  pubkey: PublicKey;
  pool: PoolAccount;
  rUsdc: bigint;
  rYes: bigint;
  rNo: bigint;
};

export async function fetchPool(
  program: VaultProgram,
  poolPda: PublicKey,
): Promise<PoolAccount> {
  const acc = await program.account.pool.fetch(poolPda);
  return acc as unknown as PoolAccount;
}

export async function fetchPoolSnapshot(
  program: VaultProgram,
  poolPda: PublicKey,
): Promise<PoolSnapshot> {
  const pool = await fetchPool(program, poolPda);
  const [u, y, n] = await Promise.all([
    getAccount(program.provider.connection, pool.usdcVault),
    getAccount(program.provider.connection, pool.yesReserves),
    getAccount(program.provider.connection, pool.noReserves),
  ]);
  return {
    pubkey: poolPda,
    pool,
    rUsdc: u.amount,
    rYes: y.amount,
    rNo: n.amount,
  };
}

export async function findPoolForMarket(
  program: VaultProgram,
  market: PublicKey,
): Promise<{ pubkey: PublicKey; account: PoolAccount } | null> {
  const rows = await program.account.pool.all([
    { memcmp: { offset: 8, bytes: market.toBase58() } },
  ]);
  if (rows.length === 0) return null;
  return {
    pubkey: rows[0].publicKey,
    account: rows[0].account as unknown as PoolAccount,
  };
}

const UNIT = 1_000_000n;
const FEE_DIVISOR = 10_000n;

/** Quote YES out for USDC in on the FPMM. */
export function quoteBuyYes(
  rYes: bigint,
  rNo: bigint,
  usdcIn: bigint,
  feeBps: number,
): bigint | null {
  if (usdcIn <= 0n || rYes <= 0n || rNo <= 0n) return null;
  const fee = FEE_DIVISOR - BigInt(feeBps);
  const usdcAfter = (usdcIn * fee) / FEE_DIVISOR;
  const newRNo = rNo + usdcAfter;
  const k = rYes * rNo;
  const newRYes = k / newRNo;
  if (newRYes >= rYes) return 0n;
  return rYes - newRYes;
}

/** Quote USDC out for YES in on the FPMM. */
export function quoteSellYes(
  rYes: bigint,
  rNo: bigint,
  yesIn: bigint,
  feeBps: number,
): bigint | null {
  if (yesIn <= 0n || rYes <= 0n || rNo <= 0n) return null;
  const fee = FEE_DIVISOR - BigInt(feeBps);
  const yesAfter = (yesIn * fee) / FEE_DIVISOR;
  const newRYes = rYes + yesAfter;
  const k = rYes * rNo;
  const newRNo = k / newRYes;
  if (newRNo >= rNo) return 0n;
  return rNo - newRNo;
}

export function impliedYesPrice(rYes: bigint, rNo: bigint): number {
  const sum = rYes + rNo;
  if (sum === 0n) return 0;
  return Number((rNo * UNIT) / sum) / Number(UNIT);
}

export { UNIT as VAULT_UNIT };
