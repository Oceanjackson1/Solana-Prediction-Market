import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getReadOnlyProgram } from "./program";
import type { MarketProgram } from "./program";

export const UNIT = 1_000_000;

export type MarketAccount = {
  pubkey: PublicKey;
  account: {
    creator: PublicKey;
    collateralMint: PublicKey;
    yesMint: PublicKey;
    noMint: PublicKey;
    collateralVault: PublicKey;
    askVault: PublicKey;
    closeTs: BN;
    resolveTs: BN;
    state: { open?: object; closed?: object; resolving?: object; resolved?: object };
    outcome: { pending?: object; yes?: object; no?: object; invalid?: object };
    totalVolume: BN;
    question: string;
    slug: string;
  };
};

export type OrderAccount = {
  pubkey: PublicKey;
  account: {
    market: PublicKey;
    maker: PublicKey;
    side: { buyYes?: object; sellYes?: object };
    price: BN;
    remaining: BN;
    locked: BN;
    nonce: BN;
    createdAt: BN;
  };
};

export async function fetchAllMarkets(
  program: MarketProgram,
): Promise<MarketAccount[]> {
  const rows = await program.account.market.all();
  return rows as unknown as MarketAccount[];
}

export async function fetchMarket(
  program: MarketProgram,
  marketPda: PublicKey,
): Promise<MarketAccount["account"]> {
  const acc = await program.account.market.fetch(marketPda);
  return acc as unknown as MarketAccount["account"];
}

export async function fetchOrdersForMarket(
  program: MarketProgram,
  marketPda: PublicKey,
): Promise<OrderAccount[]> {
  const rows = await program.account.order.all([
    { memcmp: { offset: 8, bytes: marketPda.toBase58() } },
  ]);
  return rows as unknown as OrderAccount[];
}

export function marketStateLabel(s: MarketAccount["account"]["state"]): string {
  if ("open" in s) return "Open";
  if ("closed" in s) return "Closed";
  if ("resolving" in s) return "Resolving";
  if ("resolved" in s) return "Resolved";
  return "Unknown";
}

export function orderSideLabel(
  side: OrderAccount["account"]["side"],
): "BuyYes" | "SellYes" {
  return "buyYes" in side ? "BuyYes" : "SellYes";
}

export function priceToDisplay(price: BN): string {
  return (price.toNumber() / UNIT).toFixed(3);
}

export function amountYesToDisplay(raw: BN): string {
  return (raw.toNumber() / UNIT).toFixed(2);
}

export function amountUsdcToDisplay(raw: BN): string {
  return (raw.toNumber() / UNIT).toFixed(2);
}

export function readOnlyProgram(connection: Parameters<typeof getReadOnlyProgram>[0]) {
  return getReadOnlyProgram(connection);
}
