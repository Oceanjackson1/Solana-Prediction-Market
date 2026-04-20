import { address } from "@solana/kit";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export const CLUSTER: "devnet" | "mainnet-beta" | "testnet" =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as
    | "devnet"
    | "mainnet-beta"
    | "testnet") ?? "devnet";

export const USDC_MINT_DEVNET = address(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
export const USDC_DECIMALS = 6;

export const USDC_FAUCET_URL =
  "https://spl-token-faucet.com/?token-name=USDC-Dev";
