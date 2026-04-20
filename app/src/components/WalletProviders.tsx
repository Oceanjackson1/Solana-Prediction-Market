"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";
import { RPC_URL, CLUSTER } from "@/lib/constants";

const networkMap: Record<string, WalletAdapterNetwork> = {
  devnet: WalletAdapterNetwork.Devnet,
  "mainnet-beta": WalletAdapterNetwork.Mainnet,
  testnet: WalletAdapterNetwork.Testnet,
};

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => RPC_URL ?? clusterApiUrl(networkMap[CLUSTER]),
    [],
  );
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
