"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/create", label: "Open market" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[var(--ps-black)]/90 backdrop-blur text-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded-full bg-[var(--ps-blue)]" />
          <span className="font-light text-lg tracking-tight">Arena</span>
          <span className="rounded-[3px] bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/70">
            devnet
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {NAV.map((n) => {
            const active =
              n.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  active
                    ? "rounded-[6px] bg-white/10 px-3 py-1.5 text-white"
                    : "rounded-[6px] px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/5 transition"
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
