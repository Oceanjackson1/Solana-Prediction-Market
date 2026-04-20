"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useVaultProgram } from "@/lib/anchor/vault-hooks";
import {
  quoteBuyYes,
  quoteSellYes,
  impliedYesPrice,
  type PoolSnapshot,
} from "@/lib/anchor/vault-sdk";
import { UNIT, type MarketAccount } from "@/lib/anchor/sdk";
import { useToast } from "./Toast";

type Side = "BuyYes" | "SellYes";

export function VaultTrade({
  market,
  snapshot,
  onSubmitted,
}: {
  market: MarketAccount["account"];
  snapshot: PoolSnapshot;
  onSubmitted?: () => void;
}) {
  const program = useVaultProgram();
  const { publicKey } = useWallet();
  const toast = useToast();
  const [side, setSide] = useState<Side>("BuyYes");
  const [amount, setAmount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const price = useMemo(
    () => impliedYesPrice(snapshot.rYes, snapshot.rNo),
    [snapshot.rYes, snapshot.rNo],
  );

  const quote = useMemo(() => {
    const raw = Math.round((parseFloat(amount) || 0) * UNIT);
    if (raw <= 0) return null;
    const inBig = BigInt(raw);
    if (side === "BuyYes") {
      const yesOut = quoteBuyYes(
        snapshot.rYes,
        snapshot.rNo,
        inBig,
        snapshot.pool.feeBps,
      );
      return yesOut ? { inLabel: "USDC", outLabel: "YES", out: yesOut } : null;
    }
    const usdcOut = quoteSellYes(
      snapshot.rYes,
      snapshot.rNo,
      inBig,
      snapshot.pool.feeBps,
    );
    return usdcOut
      ? { inLabel: "YES", outLabel: "USDC", out: usdcOut }
      : null;
  }, [amount, side, snapshot]);

  async function submit() {
    if (!program || !publicKey) return;
    setErr(null);
    setBusy(true);
    try {
      const raw = Math.round(parseFloat(amount) * UNIT);
      if (raw <= 0) throw new Error("amount must be > 0");

      const poolPk = snapshot.pubkey;

      const userUsdc = getAssociatedTokenAddressSync(
        market.collateralMint,
        publicKey,
      );
      const userYes = getAssociatedTokenAddressSync(market.yesMint, publicKey);

      await program.methods
        .swap(side === "BuyYes", new BN(raw), new BN(1))
        .accounts({
          user: publicKey,
          pool: poolPk,
          collateralMint: market.collateralMint,
          yesMint: market.yesMint,
          usdcVault: snapshot.pool.usdcVault,
          yesReserves: snapshot.pool.yesReserves,
          noReserves: snapshot.pool.noReserves,
          userUsdc,
          userYes,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      toast.success(
        side === "BuyYes"
          ? `Bought via vault at implied ~${price.toFixed(3)}`
          : `Sold to vault at implied ~${price.toFixed(3)}`,
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
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-sm font-medium">Vault backstop</div>
        <div className="text-xs text-zinc-500 tabular-nums">
          implied YES = {price.toFixed(3)}
        </div>
      </div>
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
      <label className="block text-xs text-zinc-500 mb-1">
        Amount in {side === "BuyYes" ? "USDC" : "YES"}
      </label>
      <input
        className="mb-3 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm tabular-nums"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {quote && (
        <p className="mb-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
          You receive ≈{" "}
          <span className="font-medium">
            {(Number(quote.out) / UNIT).toFixed(3)}
          </span>{" "}
          {quote.outLabel}
        </p>
      )}

      <button
        disabled={!publicKey || busy || !quote}
        onClick={submit}
        className="w-full rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black py-2 text-sm font-medium disabled:opacity-50"
      >
        {busy
          ? "Swapping…"
          : publicKey
            ? `Market ${side === "BuyYes" ? "buy" : "sell"} via vault`
            : "Connect wallet"}
      </button>
      {err && <p className="mt-2 text-xs text-rose-600 break-all">{err}</p>}
      <p className="mt-3 text-xs text-zinc-500">
        Fee {(snapshot.pool.feeBps / 100).toFixed(2)}% · constant-product
        AMM over YES/NO reserves. Falls back to this when the limit order
        book is empty.
      </p>
    </div>
  );
}
