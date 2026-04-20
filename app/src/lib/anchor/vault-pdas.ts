import { PublicKey } from "@solana/web3.js";
import { VAULT_PROGRAM_ID } from "./vault-program";

const enc = (s: string) => Buffer.from(s, "utf8");

export function poolPda(market: PublicKey, admin: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("pool"), market.toBuffer(), admin.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  return pda;
}

export function lpMintPda(pool: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("lp_mint"), pool.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  return pda;
}

export function usdcVaultPda(pool: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("usdc_vault"), pool.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  return pda;
}

export function yesReservesPda(pool: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("yes_reserves"), pool.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  return pda;
}

export function noReservesPda(pool: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [enc("no_reserves"), pool.toBuffer()],
    VAULT_PROGRAM_ID,
  );
  return pda;
}
