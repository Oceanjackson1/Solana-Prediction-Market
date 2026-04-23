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
    <div className="relative rounded-[12px] bg-white shadow-ps-2 p-5 overflow-hidden">
      {/* PS-blue left accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[color:var(--ps-blue)]" />
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--ps-blue)]" />
        <span className="text-sm font-semibold text-[color:var(--ps-charcoal)]">
          AI Copilot
        </span>
        <span className="text-xs text-[color:var(--ps-body-gray)]">
          deepseek-chat · structured JSON
        </span>
      </div>

      <textarea
        rows={2}
        placeholder="Describe the market in your own words — e.g. 'will Argentina win the 2026 World Cup'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="input-ps w-full text-sm"
      />

      <button
        disabled={busy || prompt.trim().length < 3}
        onClick={generate}
        className="btn-ps-primary mt-3 !text-sm !py-2 !px-4"
      >
        {busy ? "Thinking…" : "Generate spec"}
      </button>

      {err && (
        <p className="mt-2 text-xs text-[color:var(--ps-warning)] break-all">
          {err}
        </p>
      )}

      {spec && (
        <div className="mt-4 rounded-[6px] border border-[color:var(--ps-divider)] bg-[color:var(--ps-ice)] p-4 text-sm">
          {spec.safetyFlag === "unsafe" ? (
            <div>
              <p className="font-medium text-[color:var(--ps-warning)]">
                Refused for safety: {spec.safetyReason}
              </p>
              <p className="mt-1 text-xs text-[color:var(--ps-body-gray)]">
                Try a different prompt (e.g. reframe without targeting a
                specific person).
              </p>
            </div>
          ) : (
            <>
              <p className="font-semibold leading-snug text-[color:var(--ps-charcoal)]">
                {spec.question}
              </p>
              <p className="mt-2 text-xs text-[color:var(--ps-body-gray)] leading-[1.5]">
                {spec.resolutionCriteria}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-[color:var(--ps-body-gray)]">
                <span className="rounded-[3px] bg-white border border-[color:var(--ps-divider)] px-2 py-0.5">
                  {spec.category}
                </span>
                <span className="rounded-[3px] bg-white border border-[color:var(--ps-divider)] px-2 py-0.5">
                  closes {spec.closeIsoDate}
                </span>
                {spec.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[3px] bg-white border border-[color:var(--ps-divider)] px-2 py-0.5"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onAccept(spec)}
                className="btn-ps-primary mt-4 !text-sm !py-2 !px-4"
              >
                Use this spec
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
