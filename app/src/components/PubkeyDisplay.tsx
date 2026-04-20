"use client";

import { useState } from "react";
import { truncateAddr } from "@/lib/format";

export function PubkeyDisplay({
  addr,
  head = 4,
  tail = 4,
  className = "",
}: {
  addr: string;
  head?: number;
  tail?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  }

  return (
    <button
      onClick={copy}
      title={addr}
      className={
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 " +
        className
      }
    >
      <span>{truncateAddr(addr, head, tail)}</span>
      <span className="text-[10px] text-zinc-400">{copied ? "✓" : "⧉"}</span>
    </button>
  );
}
