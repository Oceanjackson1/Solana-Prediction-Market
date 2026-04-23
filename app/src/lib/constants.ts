import { address } from "@solana/kit";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export const CLUSTER: "devnet" | "mainnet-beta" | "testnet" =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as
    | "devnet"
    | "mainnet-beta"
    | "testnet") ?? "devnet";

// Collateral mint. Defaults to Circle devnet USDC. For local demo or when the
// project's mock USDC is in use, override via NEXT_PUBLIC_USDC_MINT in env.
export const USDC_MINT_DEVNET = address(
  process.env.NEXT_PUBLIC_USDC_MINT ??
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
export const USDC_DECIMALS = 6;

export const USDC_FAUCET_URL =
  "https://spl-token-faucet.com/?token-name=USDC-Dev";
