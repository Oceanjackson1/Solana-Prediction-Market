"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { address } from "@solana/kit";
import { getUsdcBalance } from "@/lib/usdc";
import { USDC_FAUCET_URL } from "@/lib/constants";

export function UsdcBalance() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getUsdcBalance(address(publicKey.toBase58()))
      .then((v) => !cancelled && setBalance(v))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!publicKey) {
    return (
      <p className="text-sm text-zinc-500">Connect a wallet to see balance.</p>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        Devnet USDC
      </span>
      <span className="text-2xl font-semibold tabular-nums">
        {loading ? "…" : balance !== null ? balance.toFixed(2) : "—"}
      </span>
      <a
        href={USDC_FAUCET_URL}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-blue-600 hover:underline"
      >
        Get devnet USDC →
      </a>
    </div>
  );
}
