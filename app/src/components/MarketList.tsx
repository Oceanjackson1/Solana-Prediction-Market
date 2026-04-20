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
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
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
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
        <p className="text-base text-zinc-600 dark:text-zinc-300">
          No markets open yet.
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Be the first — open a market and the vault will backstop it.
        </p>
        <Link
          href="/create"
          className="inline-block mt-4 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium"
        >
          Open a market →
        </Link>
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

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
      <div className="flex gap-2">
        <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
      <div className="mt-3 h-5 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
      <div className="mt-2 h-5 w-3/4 rounded bg-zinc-100 dark:bg-zinc-900" />
      <div className="mt-6 flex justify-between">
        <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}
