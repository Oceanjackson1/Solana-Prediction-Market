import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { MARKET_PROGRAM_ID } from "./program";

const enc = (s: string) => Buffer.from(s, "utf8");

export function marketPda(creator: PublicKey, slug: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("market"), creator.toBuffer(), enc(slug)],
    MARKET_PROGRAM_ID,
  );
  return pda;
}

export function yesMintPda(market: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("yes_mint"), market.toBuffer()],
    MARKET_PROGRAM_ID,
  );
  return pda;
}

export function noMintPda(market: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("no_mint"), market.toBuffer()],
    MARKET_PROGRAM_ID,
  );
  return pda;
}

export function collateralVaultPda(market: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("vault"), market.toBuffer()],
    MARKET_PROGRAM_ID,
  );
  return pda;
}

export function askVaultPda(market: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("ask_vault"), market.toBuffer()],
    MARKET_PROGRAM_ID,
  );
  return pda;
}

export function orderPda(
  market: PublicKey,
  maker: PublicKey,
  nonce: BN,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      enc("order"),
      market.toBuffer(),
      maker.toBuffer(),
      nonce.toArrayLike(Buffer, "le", 8),
    ],
    MARKET_PROGRAM_ID,
  );
  return pda;
}
