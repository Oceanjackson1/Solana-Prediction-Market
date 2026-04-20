"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useMarketProgram } from "@/lib/anchor/hooks";
import {
  askVaultPda,
  collateralVaultPda,
  orderPda,
  yesMintPda,
} from "@/lib/anchor/pdas";
import { UNIT, type MarketAccount } from "@/lib/anchor/sdk";
import { useToast } from "./Toast";

type Side = "BuyYes" | "SellYes";

export function TradePanel({
  market,
  marketPubkey,
  onSubmitted,
}: {
  market: MarketAccount["account"];
  marketPubkey: PublicKey;
  onSubmitted?: () => void;
}) {
  const program = useMarketProgram();
  const { publicKey } = useWallet();
  const toast = useToast();
  const [side, setSide] = useState<Side>("BuyYes");
  const [price, setPrice] = useState("0.50");
  const [amount, setAmount] = useState("5");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!program || !publicKey) return;
    setErr(null);
    setBusy(true);
    try {
      const priceN = Math.round(parseFloat(price) * UNIT);
      const amountN = Math.round(parseFloat(amount) * UNIT);
      if (!(priceN > 0 && priceN < UNIT))
        throw new Error("price must be between 0 and 1");
      if (amountN <= 0) throw new Error("amount must be > 0");

      const yesMint = yesMintPda(marketPubkey);
      const collateralVault = collateralVaultPda(marketPubkey);
      const askVault = askVaultPda(marketPubkey);

      const nonce = new BN(Date.now());
      const order = orderPda(marketPubkey, publicKey, nonce);
      const makerUsdc = getAssociatedTokenAddressSync(
        market.collateralMint,
        publicKey,
      );
      const makerYes = getAssociatedTokenAddressSync(yesMint, publicKey);

      await program.methods
        .placeOrder({
          side: side === "BuyYes" ? ({ buyYes: {} } as never) : ({ sellYes: {} } as never),
          price: new BN(priceN),
          amount: new BN(amountN),
          nonce,
        })
        .accounts({
          maker: publicKey,
          market: marketPubkey,
          collateralMint: market.collateralMint,
          yesMint,
          collateralVault,
          askVault,
          order,
          makerUsdc,
          makerYes,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      toast.success(
        `${side === "BuyYes" ? "Bid" : "Ask"} placed: ${amount} YES @ ${price}`,
      );
      onSubmitted?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="mb-2 text-sm font-medium">Place limit order</div>
      <div className="flex gap-1 mb-3">
        {(["BuyYes", "SellYes"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm ${
              side === s
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600"
            }`}
          >
            {s === "BuyYes" ? "Buy YES" : "Sell YES"}
          </button>
        ))}
      </div>
      <label className="block text-xs text-zinc-500 mb-1">Price (0–1)</label>
      <input
        className="mb-3 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm tabular-nums"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <label className="block text-xs text-zinc-500 mb-1">Amount (YES)</label>
      <input
        className="mb-3 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm tabular-nums"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        disabled={!publicKey || busy}
        onClick={submit}
        className="w-full rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black py-2 text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Submitting…" : publicKey ? "Place order" : "Connect wallet"}
      </button>
      {err && (
        <p className="mt-2 text-xs text-rose-600 break-all">{err}</p>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        {side === "BuyYes"
          ? "Locks USDC in the collateral vault. Filled when a taker sells YES at or below your price."
          : "Locks YES in the ask vault. You must already hold YES (mint a complete set first)."}
      </p>
    </div>
  );
}
