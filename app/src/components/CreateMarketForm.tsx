"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useMarketProgram } from "@/lib/anchor/hooks";
import {
  askVaultPda,
  collateralVaultPda,
  marketPda,
  noMintPda,
  yesMintPda,
} from "@/lib/anchor/pdas";
import { USDC_MINT_DEVNET } from "@/lib/constants";
import { CopilotPanel } from "./CopilotPanel";
import { useToast } from "./Toast";
import type { MarketSpec } from "@/lib/ai/schema";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
}

export function CreateMarketForm() {
  const router = useRouter();
  const program = useMarketProgram();
  const { publicKey } = useWallet();
  const toast = useToast();

  const [question, setQuestion] = useState("");
  const [resolutionCriteria, setResolutionCriteria] = useState("");
  const [closeDate, setCloseDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [resolveDate, setResolveDate] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function acceptSpec(spec: MarketSpec) {
    setQuestion(spec.question);
    setResolutionCriteria(spec.resolutionCriteria);
    setCloseDate(spec.closeIsoDate);
    setResolveDate(spec.resolveIsoDate);
  }

  async function submit() {
    if (!program || !publicKey) return;
    setErr(null);
    setBusy(true);
    try {
      const slug = slugify(question) || `m-${Date.now().toString(36)}`;
      const closeTs = Math.floor(new Date(closeDate).getTime() / 1000);
      const resolveTs = resolveDate
        ? Math.floor(new Date(resolveDate).getTime() / 1000)
        : closeTs + 60 * 60 * 24;

      const collateralMint = new PublicKey(USDC_MINT_DEVNET);
      const market = marketPda(publicKey, slug);
      const yesMint = yesMintPda(market);
      const noMint = noMintPda(market);
      const collateralVault = collateralVaultPda(market);
      const askVault = askVaultPda(market);

      // Embed resolution criteria inside the question text (MVP: single string).
      const encoded = resolutionCriteria
        ? `${question}\n\nResolves: ${resolutionCriteria}`
        : question;
      const truncated =
        encoded.length > 120 ? encoded.slice(0, 117) + "…" : encoded;

      await program.methods
        .createMarket({
          slug,
          question: truncated,
          closeTs: new BN(closeTs),
          resolveTs: new BN(resolveTs),
        })
        .accounts({
          creator: publicKey,
          market,
          collateralMint,
          yesMint,
          noMint,
          collateralVault,
          askVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      toast.success("Market created — opening…");
      router.push(`/markets/${market.toBase58()}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto px-6 py-12 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Open a market
        </h1>
        <p className="text-sm text-zinc-500">
          Ask a YES/NO question. Anyone can trade against your market; the vault
          backstops thin order books.
        </p>
      </div>

      <CopilotPanel onAccept={acceptSpec} />

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Question</label>
        <textarea
          rows={2}
          placeholder="Will Argentina win the 2026 World Cup?"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Resolution criteria
        </label>
        <textarea
          rows={2}
          placeholder="How does this market resolve YES/NO? Cite a source."
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
          value={resolutionCriteria}
          onChange={(e) => setResolutionCriteria(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Close date</label>
          <input
            type="date"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Resolve date (optional)
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm"
            value={resolveDate}
            onChange={(e) => setResolveDate(e.target.value)}
          />
        </div>
      </div>

      <button
        disabled={!publicKey || busy || question.trim().length < 6}
        onClick={submit}
        className="w-full rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black py-2 text-sm font-medium disabled:opacity-50"
      >
        {busy
          ? "Creating…"
          : publicKey
            ? "Create market"
            : "Connect wallet"}
      </button>
      {err && <p className="text-xs text-rose-600 break-all">{err}</p>}
    </div>
  );
}
