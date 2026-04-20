import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import vaultIdl from "./vault.json";
import type { Vault as VaultIdlType } from "./vault";

export const VAULT_PROGRAM_ID = new PublicKey(
  (vaultIdl as Idl).address ?? "7qmi9b1z7DvDMRDhFf6nzahtCkuA5xRaesv3QphT4gQJ",
);

export type VaultProgram = Program<VaultIdlType>;

export function getReadOnlyVaultProgram(connection: Connection): VaultProgram {
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
  return new Program(vaultIdl as VaultIdlType, provider);
}
