"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useMarketProgram } from "@/lib/anchor/hooks";
import { collateralVaultPda } from "@/lib/anchor/pdas";
import { UNIT, type MarketAccount } from "@/lib/anchor/sdk";
import { useToast } from "./Toast";

type Side = "yes" | "no";

export function RedeemWinning({
  market,
  marketPubkey,
  winningSide,
  onRedeemed,
}: {
  market: MarketAccount["account"];
  marketPubkey: PublicKey;
  winningSide: Side;
  onRedeemed?: () => void;
}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useMarketProgram();
  const toast = useToast();

  const [balance, setBalance] = useState<bigint>(0n);
  const [amount, setAmount] = useState("0");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    const mint = winningSide === "yes" ? market.yesMint : market.noMint;
    const ata = getAssociatedTokenAddressSync(mint, publicKey);
    getAccount(connection, ata)
      .then((acc) => setBalance(acc.amount))
      .catch(() => setBalance(0n));
  }, [connection, publicKey, market.yesMint, market.noMint, winningSide]);

  const balanceDisplay = (Number(balance) / UNIT).toFixed(2);
  const max = Number(balance) / UNIT;

  async function submit() {
    if (!program || !publicKey) return;
    setBusy(true);
    try {
      const raw = Math.round(parseFloat(amount) * UNIT);
      if (raw <= 0) throw new Error("amount must be > 0");
      if (BigInt(raw) > balance)
        throw new Error("amount exceeds your winning balance");

      const userUsdc = getAssociatedTokenAddressSync(
        market.collateralMint,
        publicKey,
      );
      const userYes = getAssociatedTokenAddressSync(market.yesMint, publicKey);
      const userNo = getAssociatedTokenAddressSync(market.noMint, publicKey);

      const sig = await program.methods
        .redeemWinning(new BN(raw))
        .accounts({
          user: publicKey,
          market: marketPubkey,
          collateralMint: market.collateralMint,
          yesMint: market.yesMint,
          noMint: market.noMint,
          collateralVault: collateralVaultPda(marketPubkey),
          userCollateral: userUsdc,
          userYes,
          userNo,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      toast.success(
        `Redeemed ${(raw / UNIT).toFixed(2)} ${winningSide.toUpperCase()} → ${(raw / UNIT).toFixed(2)} USDC`,
      );
      onRedeemed?.();
      setAmount("0");
      // refresh balance
      const mint = winningSide === "yes" ? market.yesMint : market.noMint;
      const ata = getAssociatedTokenAddressSync(mint, publicKey);
      try {
        const acc = await getAccount(connection, ata);
        setBalance(acc.amount);
      } catch {
        setBalance(0n);
      }
      void sig;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!publicKey || max <= 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
        <div className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
          Market resolved · {winningSide.toUpperCase()}
        </div>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
          {publicKey
            ? `You have no ${winningSide.toUpperCase()} tokens to redeem. If you sold early, that's your P&L already.`
            : "Connect the wallet that holds winning tokens to redeem."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
          Redeem winning
        </div>
        <div className="text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
          balance {balanceDisplay} {winningSide.toUpperCase()}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm tabular-nums"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />
        <button
          type="button"
          className="rounded-lg border border-emerald-300 dark:border-emerald-800 px-2 py-2 text-xs text-emerald-800 dark:text-emerald-300"
          onClick={() => setAmount(max.toString())}
        >
          Max
        </button>
      </div>
      <button
        disabled={busy}
        onClick={submit}
        className="btn-ps-commerce mt-3 w-full !text-sm !py-2"
      >
        {busy ? "Redeeming…" : `Redeem ${winningSide.toUpperCase()} → USDC`}
      </button>
      <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
        Each winning token redeems for 1 USDC from the collateral vault.
      </p>
    </div>
  );
}
