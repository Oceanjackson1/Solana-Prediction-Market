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
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-black/70 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500" />
          <span className="font-semibold tracking-tight">Arena</span>
          <span className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
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
                    ? "rounded-lg bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
                    : "rounded-lg px-3 py-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900"
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
