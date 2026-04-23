"use client";

import { useState } from "react";
import type { MarketSpec } from "@/lib/ai/schema";

export function CopilotPanel({
  onAccept,
}: {
  onAccept: (spec: MarketSpec) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [spec, setSpec] = useState<MarketSpec | null>(null);

  async function generate() {
    setErr(null);
    setBusy(true);
    setSpec(null);
    try {
      const r = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "copilot failed");
      setSpec(json.spec as MarketSpec);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-violet-950 dark:via-zinc-950 dark:to-pink-950">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
        <span className="text-sm font-medium">AI Copilot</span>
        <span className="text-xs text-zinc-500">
          deepseek-chat · structured JSON
        </span>
      </div>

      <textarea
        rows={2}
        placeholder="Describe the market in your own words — e.g. 'will Argentina win the 2026 World Cup'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
      />

      <button
        disabled={busy || prompt.trim().length < 3}
        onClick={generate}
        className="mt-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        {busy ? "Thinking…" : "Generate spec"}
      </button>

      {err && <p className="mt-2 text-xs text-rose-600 break-all">{err}</p>}

      {spec && (
        <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-sm">
          {spec.safetyFlag === "unsafe" ? (
            <div>
              <p className="font-medium text-rose-600">
                Refused for safety: {spec.safetyReason}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Try a different prompt (e.g. reframe without targeting a
                specific person).
              </p>
            </div>
          ) : (
            <>
              <p className="font-medium leading-snug">{spec.question}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {spec.resolutionCriteria}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-xs text-zinc-500">
                <span className="rounded bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5">
                  {spec.category}
                </span>
                <span>closes {spec.closeIsoDate}</span>
                {spec.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onAccept(spec)}
                className="mt-3 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white px-3 py-1.5 text-xs font-medium"
              >
                Use this spec ↓
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
