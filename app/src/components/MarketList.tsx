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
      <div className="rounded-[12px] border border-dashed border-[color:var(--ps-mute)] bg-white p-10 text-center">
        <p className="text-xl font-light text-[color:var(--ps-charcoal)] leading-[1.25]">
          No markets open yet.
        </p>
        <p className="mt-2 text-sm text-[color:var(--ps-body-gray)]">
          Be the first — open a market and the vault will backstop it.
        </p>
        <Link href="/create" className="btn-ps-primary mt-6">
          Open a market
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
