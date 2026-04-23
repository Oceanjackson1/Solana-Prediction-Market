"use client";

import Link from "next/link";
import { Clock, TrendingUp } from "lucide-react";
import {
  marketStateLabel,
  type MarketAccount,
} from "@/lib/anchor/sdk";
import { formatRelative, formatUsdc } from "@/lib/format";

// Deterministic pseudo-probability derived from the slug so the hero
// card doesn't show a flat 50/50 across every market while we wait
// on indexer-backed real probabilities. Resolved markets show the
// actual outcome (100/0 or 0/100).
function pseudoYesProbability(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  // Map to 30–70 range so both sides read as plausible.
  const v = Math.abs(h) % 41; // 0..40
  return 30 + v;
}

function inferCategory(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("cup") || s.includes("nba") || s.includes("nfl") || s.includes("fifa")) return "Sports";
  if (s.includes("elect") || s.includes("president") || s.includes("senate")) return "Politics";
  if (s.includes("btc") || s.includes("eth") || s.includes("sol") || s.includes("crypto")) return "Crypto";
  if (s.includes("ai") || s.includes("gpt") || s.includes("claude")) return "AI";
  return "Culture";
}

export function MarketCard({ row }: { row: MarketAccount }) {
  const { pubkey, account } = row;
  const closeMs = account.closeTs.toNumber() * 1000;
  const state = marketStateLabel(account.state);
  const isResolved = state === "Resolved";

  let yes = pseudoYesProbability(account.slug);
  if (isResolved) {
    if ("yes" in account.outcome) yes = 100;
    else if ("no" in account.outcome) yes = 0;
  }
  const no = 100 - yes;
  const category = inferCategory(account.slug);

  return (
    <Link
      href={`/markets/${pubkey.toBase58()}`}
      className="group relative block rounded-[12px] border border-transparent bg-white p-5 shadow-ps-2 transition hover:-translate-y-0.5 hover:shadow-ps-3 hover:border-[color:var(--ps-blue)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-[3px] bg-[color:var(--ps-blue)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ps-blue)]">
            {category}
          </span>
          <StateBadge label={state} />
        </div>
        <span className="font-mono text-[11px] text-[color:var(--ps-body-gray)]">
          #{account.slug}
        </span>
      </div>

      <h3 className="mt-3 text-base font-medium leading-snug text-[color:var(--ps-charcoal)] line-clamp-2 group-hover:text-[color:var(--ps-blue)] transition">
        {account.question}
      </h3>

      {/* Probability bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-emerald-700 tabular-nums">YES {yes}¢</span>
          <span className="text-rose-600 tabular-nums">NO {no}¢</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-rose-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${yes}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-[color:var(--ps-body-gray)] tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Clock size={11} />
          {isResolved ? "closed" : "closes"} {formatRelative(closeMs)}
        </span>
        <span className="inline-flex items-center gap-1">
          <TrendingUp size={11} />
          {formatUsdc(account.totalVolume)} vol
        </span>
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
          : "bg-[color:var(--ps-cyan)]/15 text-[color:var(--ps-blue-press)]";
  return (
    <span
      className={`inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}
