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
      className="group block rounded-[12px] border border-transparent bg-white p-5 shadow-ps-2 hover:shadow-ps-3 hover:border-[color:var(--ps-blue)] transition"
    >
      <div className="flex items-center gap-2 text-xs text-[color:var(--ps-body-gray)]">
        <StateBadge label={state} />
        <span className="font-mono">#{account.slug}</span>
      </div>

      <h3 className="mt-2 text-base font-medium leading-snug text-[color:var(--ps-charcoal)] line-clamp-2 group-hover:text-[color:var(--ps-blue)] transition">
        {account.question}
      </h3>

      <div className="mt-4 flex justify-between text-xs text-[color:var(--ps-body-gray)] tabular-nums">
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
      ? "bg-emerald-100 text-emerald-700"
      : label === "Resolving"
        ? "bg-amber-100 text-amber-700"
        : label === "Closed"
          ? "bg-zinc-200 text-zinc-700"
          : "bg-[color:var(--ps-blue)]/10 text-[color:var(--ps-blue)]";
  return (
    <span
      className={`inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
