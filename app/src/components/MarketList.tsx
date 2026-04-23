"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchAllMarkets, type MarketAccount } from "@/lib/anchor/sdk";
import { getReadOnlyProgram } from "@/lib/anchor/program";
import { MarketCard } from "./MarketCard";

export function MarketList() {
  const { connection } = useConnection();
  const [markets, setMarkets] = useState<MarketAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const program = getReadOnlyProgram(connection);
    fetchAllMarkets(program)
      .then((rows) => !cancelled && setMarkets(rows))
      .catch((e) => !cancelled && setError(e.message ?? String(e)));
    return () => {
      cancelled = true;
    };
  }, [connection]);

  if (error) {
    return (
      <div className="rounded-[6px] border border-[color:var(--ps-warning)]/30 bg-[color:var(--ps-warning)]/5 p-4 text-sm text-[color:var(--ps-warning)]">
        Couldn&apos;t load markets — {error}
      </div>
    );
  }

  if (!markets) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div>
        {/* Preview of what markets will look like */}
        <div className="relative">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pointer-events-none select-none opacity-50">
            <PreviewCard
              category="Sports"
              question="Will Argentina win the 2026 FIFA World Cup final?"
              yes={68}
              closes="in 3mo"
              vol="2.4M"
            />
            <PreviewCard
              category="AI"
              question="Will GPT-6 be released before end of 2026?"
              yes={42}
              closes="in 8mo"
              vol="890k"
            />
            <PreviewCard
              category="Crypto"
              question="Will SOL close above $500 on Dec 31 2026?"
              yes={33}
              closes="in 11mo"
              vol="1.2M"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white" />
        </div>

        <div className="relative -mt-16 rounded-[16px] border border-dashed border-[color:var(--ps-mute)] bg-white p-10 text-center shadow-ps-1">
          <p className="text-xl font-light text-[color:var(--ps-charcoal)] leading-[1.25]">
            Markets will appear here when seeded.
          </p>
          <p className="mt-2 mx-auto max-w-md text-sm text-[color:var(--ps-body-gray)] leading-[1.5]">
            This is a fresh devnet deployment — the first markets are being
            prepared. Want to try opening one yourself?
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/create" className="btn-ps-primary">
              Open a market
            </Link>
            <Link href="/#how-it-works" className="btn-ps-ghost">
              Read how it works
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {markets.map((m) => (
        <MarketCard key={m.pubkey.toBase58()} row={m} />
      ))}
    </div>
  );
}

function PreviewCard({
  category,
  question,
  yes,
  closes,
  vol,
}: {
  category: string;
  question: string;
  yes: number;
  closes: string;
  vol: string;
}) {
  const no = 100 - yes;
  return (
    <div className="rounded-[12px] border border-transparent bg-white p-5 shadow-ps-2">
      <div className="flex items-center justify-between">
        <span className="rounded-[3px] bg-[color:var(--ps-blue)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ps-blue)]">
          {category}
        </span>
        <span className="rounded-[3px] bg-[color:var(--ps-cyan)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ps-blue-press)]">
          Preview
        </span>
      </div>
      <h3 className="mt-3 text-base font-medium leading-snug text-[color:var(--ps-charcoal)] line-clamp-2">
        {question}
      </h3>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-emerald-700">YES {yes}¢</span>
          <span className="text-rose-600">NO {no}¢</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-rose-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${yes}%` }}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-[color:var(--ps-body-gray)] tabular-nums">
        <span>closes {closes}</span>
        <span>{vol} vol</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[12px] border border-transparent bg-white p-5 shadow-ps-2">
      <div className="flex gap-2">
        <div className="h-4 w-16 rounded-[3px] bg-zinc-100" />
        <div className="h-4 w-20 rounded-[3px] bg-zinc-100" />
      </div>
      <div className="mt-3 h-5 w-full rounded-[3px] bg-zinc-100" />
      <div className="mt-2 h-5 w-3/4 rounded-[3px] bg-zinc-100" />
      <div className="mt-6 flex justify-between">
        <div className="h-3 w-24 rounded-[3px] bg-zinc-100" />
        <div className="h-3 w-20 rounded-[3px] bg-zinc-100" />
      </div>
    </div>
  );
}
