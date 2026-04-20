import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import marketIdl from "./market.json";
import type { Market as MarketIdlType } from "./market";

export const MARKET_PROGRAM_ID = new PublicKey(
  (marketIdl as Idl).address ?? "3dphwMrHCNYzeAmeY8r6NNfdDCDrqYQQAuoDpHBZntGM",
);

export type MarketProgram = Program<MarketIdlType>;

export function getReadOnlyProgram(connection: Connection): MarketProgram {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("read-only");
    },
    signAllTransactions: async () => {
      throw new Error("read-only");
    },
  };
  const provider = new AnchorProvider(connection, dummyWallet as never, {
    commitment: "confirmed",
  });
  return new Program(marketIdl as MarketIdlType, provider);
}
