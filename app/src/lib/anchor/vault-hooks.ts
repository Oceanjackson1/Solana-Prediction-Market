"use client";

import { useMemo } from "react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import type { Vault as VaultIdlType } from "./vault";
import vaultIdl from "./vault.json";

export function useVaultProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    return new Program(vaultIdl as VaultIdlType, provider);
  }, [connection, wallet]);
}
