"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet as WalletIcon, ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { WalletModal } from "./WalletModal";

export function ConnectButton() {
  const { connected, publicKey, disconnect, wallet, connecting } = useWallet();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const short = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : "";

  const copy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (connected && publicKey) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur transition hover:border-[color:var(--ps-cyan)] hover:bg-white/10"
        >
          {wallet?.adapter.icon ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={wallet.adapter.icon} alt="" className="h-4 w-4" />
          ) : (
            <WalletIcon size={14} />
          )}
          <span className="font-mono text-[13px] tabular-nums">{short}</span>
          <ChevronDown size={14} className={menuOpen ? "rotate-180 transition" : "transition"} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-[110%] z-50 w-56 overflow-hidden rounded-[12px] border border-[color:var(--ps-divider)] bg-white shadow-ps-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={copy}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[color:var(--ps-charcoal)] transition hover:bg-[color:var(--ps-ice)]"
            >
              <span className="flex items-center gap-2">
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy address"}
              </span>
              <span className="font-mono text-xs text-[color:var(--ps-body-gray)]">{short}</span>
            </button>
            <div className="border-t border-[color:var(--ps-divider)]" />
            <button
              type="button"
              onClick={() => {
                disconnect().catch(() => {});
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[color:var(--ps-warning)] transition hover:bg-[color:var(--ps-warning)]/5"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ps-blue)] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[color:var(--ps-cyan)] hover:shadow-[0_0_0_2px_var(--ps-blue)] hover:scale-[1.04] disabled:opacity-50"
      >
        <WalletIcon size={14} />
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      <WalletModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
