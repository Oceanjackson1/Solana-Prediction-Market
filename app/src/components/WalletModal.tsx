"use client";

import { useEffect } from "react";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { X, ExternalLink } from "lucide-react";

export function WalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { wallets, select } = useWallet();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const installed = wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed,
  );
  const loadable = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Loadable ||
      w.readyState === WalletReadyState.NotDetected,
  );

  const handleSelect = (w: Wallet) => {
    select(w.adapter.name);
    onClose();
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-ps-hero">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--ps-divider)] px-6 py-5">
          <div>
            <h2 className="text-[22px] font-light leading-[1.25] text-[color:var(--ps-display-ink)]">
              Connect a wallet
            </h2>
            <p className="mt-0.5 text-xs text-[color:var(--ps-body-gray)]">
              You control your keys. Arena never takes custody.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-[color:var(--ps-body-gray)] hover:bg-[color:var(--ps-ice)] hover:text-[color:var(--ps-charcoal)] transition"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Wallet list */}
        <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
          {installed.length > 0 && (
            <>
              <SectionLabel>Installed</SectionLabel>
              <ul className="space-y-1">
                {installed.map((w) => (
                  <WalletRow key={w.adapter.name} wallet={w} onSelect={handleSelect} status="installed" />
                ))}
              </ul>
            </>
          )}

          {loadable.length > 0 && (
            <>
              <SectionLabel>More wallets</SectionLabel>
              <ul className="space-y-1">
                {loadable.map((w) => (
                  <WalletRow key={w.adapter.name} wallet={w} onSelect={handleSelect} status="not-installed" />
                ))}
              </ul>
            </>
          )}

          {installed.length === 0 && loadable.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-[color:var(--ps-body-gray)]">
              No Solana wallets detected.
            </div>
          )}
        </div>

        {/* Education footer */}
        <a
          href="https://phantom.app/"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between border-t border-[color:var(--ps-divider)] bg-[color:var(--ps-ice)] px-6 py-4 text-sm transition hover:bg-[color:var(--ps-blue)]/5"
        >
          <div>
            <div className="font-medium text-[color:var(--ps-charcoal)]">
              New to Solana?
            </div>
            <div className="text-xs text-[color:var(--ps-body-gray)]">
              Get started with Phantom in under a minute.
            </div>
          </div>
          <span className="flex items-center gap-1 text-[color:var(--ps-blue)] group-hover:text-[color:var(--ps-cyan)] transition">
            <span>Install</span>
            <ExternalLink size={14} />
          </span>
        </a>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ps-body-gray)]">
      {children}
    </div>
  );
}

function WalletRow({
  wallet,
  onSelect,
  status,
}: {
  wallet: Wallet;
  onSelect: (w: Wallet) => void;
  status: "installed" | "not-installed";
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(wallet)}
        className="group flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left transition hover:bg-[color:var(--ps-ice)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wallet.adapter.icon}
          alt=""
          className="h-8 w-8 rounded-[6px]"
        />
        <div className="flex-1">
          <div className="text-[15px] font-medium leading-tight text-[color:var(--ps-charcoal)]">
            {wallet.adapter.name}
          </div>
        </div>
        <span
          className={
            status === "installed"
              ? "rounded-[3px] bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700"
              : "rounded-[3px] bg-[color:var(--ps-ice)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ps-body-gray)]"
          }
        >
          {status === "installed" ? "Detected" : "Install"}
        </span>
      </button>
    </li>
  );
}
