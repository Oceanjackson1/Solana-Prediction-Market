"use client";

import Link from "next/link";
import {
  marketStateLabel,
  type MarketAccount,
} from "@/lib/anchor/sdk";
import { formatRelative, formatUsdc } from "@/lib/format";

export function MarketCard({ row }: { row: MarketAccount }) {
  const { pubkey, account } = row;
  const closeMs = account.closeTs.toNumber() * 1000;
  const state = marketStateLabel(account.state);
  const isResolved = state === "Resolved";

  return (
    <Link
      href={`/markets/${pubkey.toBase58()}`}
      className="group block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition"
    >
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <StateBadge label={state} />
        <span className="font-mono">#{account.slug}</span>
      </div>

      <h3 className="mt-2 text-base font-medium leading-snug text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-black dark:group-hover:text-white">
        {account.question}
      </h3>

      <div className="mt-4 flex justify-between text-xs text-zinc-500 tabular-nums">
        <span>
          {isResolved ? "closed" : "closes"} {formatRelative(closeMs)}
        </span>
        <span>vol {formatUsdc(account.totalVolume)} USDC</span>
      </div>
    </Link>
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
