"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  fetchMarket,
  fetchOrdersForMarket,
  marketStateLabel,
  type MarketAccount,
  type OrderAccount,
} from "@/lib/anchor/sdk";
import { getReadOnlyProgram } from "@/lib/anchor/program";
import { useMarketProgram } from "@/lib/anchor/hooks";
import {
  askVaultPda,
  collateralVaultPda,
  yesMintPda,
} from "@/lib/anchor/pdas";
import { getReadOnlyVaultProgram } from "@/lib/anchor/vault-program";
import {
  findPoolForMarket,
  fetchPoolSnapshot,
  type PoolSnapshot,
} from "@/lib/anchor/vault-sdk";
import { formatRelative, formatUsdc } from "@/lib/format";
import { OrderBook } from "./OrderBook";
import { TradePanel } from "./TradePanel";
import { VaultTrade } from "./VaultTrade";
import { RedeemWinning } from "./RedeemWinning";
import { PubkeyDisplay } from "./PubkeyDisplay";
import { useToast } from "./Toast";

type MarketData = MarketAccount["account"];

function outcomeLabel(o: MarketData["outcome"]): "Yes" | "No" | "Invalid" | "Pending" {
  if ("yes" in o) return "Yes";
  if ("no" in o) return "No";
  if ("invalid" in o) return "Invalid";
  return "Pending";
}

export function MarketDetail({ marketId }: { marketId: string }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useMarketProgram();
  const toast = useToast();
  const marketPubkey = new PublicKey(marketId);

  const [market, setMarket] = useState<MarketData | null>(null);
  const [orders, setOrders] = useState<OrderAccount[]>([]);
  const [vaultSnap, setVaultSnap] = useState<PoolSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(() => {
    const ro = getReadOnlyProgram(connection);
    const vro = getReadOnlyVaultProgram(connection);
    Promise.all([
      fetchMarket(ro, marketPubkey),
      fetchOrdersForMarket(ro, marketPubkey),
      findPoolForMarket(vro, marketPubkey),
    ])
      .then(async ([m, o, poolRow]) => {
        setMarket(m);
        setOrders(o);
        if (poolRow) {
          const snap = await fetchPoolSnapshot(vro, poolRow.pubkey);
          setVaultSnap(snap);
        } else {
          setVaultSnap(null);
        }
      })
      .catch((e) => setError(e.message ?? String(e)));
  }, [connection, marketPubkey]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const onCancel = useCallback(
    async (o: OrderAccount) => {
      if (!program || !publicKey || !market) return;
      try {
        const yesMint = yesMintPda(marketPubkey);
        await program.methods
          .cancelOrder()
          .accounts({
            maker: publicKey,
            market: marketPubkey,
            collateralMint: market.collateralMint,
            yesMint,
            collateralVault: collateralVaultPda(marketPubkey),
            askVault: askVaultPda(marketPubkey),
            order: o.pubkey,
            makerUsdc: getAssociatedTokenAddressSync(
              market.collateralMint,
              publicKey,
            ),
            makerYes: getAssociatedTokenAddressSync(yesMint, publicKey),
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        toast.success("Order canceled — escrow refunded");
        setNonce((n) => n + 1);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    },
    [program, publicKey, market, marketPubkey, toast],
  );

  if (error)
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      </div>
    );

  if (!market) {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-10">
        <div className="h-5 w-32 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse mb-3" />
        <div className="h-8 w-3/4 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </div>
    );
  }

  const stateLabel = marketStateLabel(market.state);
  const resolved = stateLabel === "Resolved";
  const outcome = outcomeLabel(market.outcome);
  const closeMs = market.closeTs.toNumber() * 1000;

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-10 space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
          <StateBadge label={stateLabel} />
          <span className="font-mono">#{market.slug}</span>
          <span>
            {resolved ? "closed" : "closes"} {formatRelative(closeMs)}
          </span>
          <span className="tabular-nums">
            vol {formatUsdc(market.totalVolume)} USDC
          </span>
          <PubkeyDisplay addr={marketPubkey.toBase58()} />
          {vaultSnap && !resolved && (
            <Link
              href={`/vault/${marketPubkey.toBase58()}`}
              className="ml-auto rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 hover:bg-emerald-100"
            >
              Vault liquidity →
            </Link>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
          {market.question}
        </h1>
      </header>

      {resolved && (
        <ResolvedBanner outcome={outcome} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OrderBook orders={orders} onCancel={onCancel} />
        <div className="space-y-4">
          {resolved && (outcome === "Yes" || outcome === "No") ? (
            <RedeemWinning
              market={market}
              marketPubkey={marketPubkey}
              winningSide={outcome === "Yes" ? "yes" : "no"}
              onRedeemed={() => setNonce((n) => n + 1)}
            />
          ) : resolved ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-600 dark:text-zinc-300">
              Market resolved <span className="font-semibold">INVALID</span>.
              Holders of matched YES+NO pairs can redeem via{" "}
              <code className="font-mono text-xs">redeem_complete_set</code>.
            </div>
          ) : (
            <>
              <TradePanel
                market={market}
                marketPubkey={marketPubkey}
                onSubmitted={() => setNonce((n) => n + 1)}
              />
              {vaultSnap ? (
                <VaultTrade
                  market={market}
                  snapshot={vaultSnap}
                  onSubmitted={() => setNonce((n) => n + 1)}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-xs text-zinc-500">
                  No vault pool for this market yet.{" "}
                  <Link
                    href={`/vault/${marketPubkey.toBase58()}`}
                    className="underline"
                  >
                    Create one →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StateBadge({ label }: { label: string }) {
  const tone =
    label === "Resolved"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : label === "Resolving"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : label === "Closed"
          ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}

function ResolvedBanner({ outcome }: { outcome: "Yes" | "No" | "Invalid" | "Pending" }) {
  const accent =
    outcome === "Yes"
      ? "from-emerald-500 to-teal-500"
      : outcome === "No"
        ? "from-rose-500 to-pink-500"
        : "from-zinc-500 to-zinc-700";
  return (
    <div
      className={`rounded-2xl bg-gradient-to-r ${accent} text-white p-5 flex items-center justify-between`}
    >
      <div>
        <div className="text-xs uppercase tracking-widest opacity-90">
          Resolved
        </div>
        <div className="mt-1 text-2xl font-semibold">{outcome.toUpperCase()}</div>
      </div>
      <div className="text-sm opacity-90">
        {outcome === "Invalid"
          ? "Use redeem_complete_set for matched YES+NO pairs."
          : `Winning token holders can redeem 1:1 for USDC →`}
      </div>
    </div>
  );
}
