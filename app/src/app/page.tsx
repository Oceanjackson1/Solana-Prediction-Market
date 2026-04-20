import { UsdcBalance } from "@/components/UsdcBalance";
import { MarketList } from "@/components/MarketList";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 w-full flex-col items-center bg-zinc-50 dark:bg-black">
      <section className="relative w-full overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div
          className="absolute inset-0 -z-10 opacity-60 dark:opacity-40"
          style={{
            background:
              "radial-gradient(1200px 400px at 20% 0%, rgba(168, 85, 247, 0.15), transparent 60%), radial-gradient(900px 400px at 80% 100%, rgba(244, 114, 182, 0.12), transparent 60%)",
          }}
        />
        <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Colosseum Frontier · devnet
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
            Prediction markets for the{" "}
            <span className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 bg-clip-text text-transparent">
              long tail.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Open any market with an AI copilot. A Solana vault backstops thin
            order books so trades clear instantly — no cold-start problem.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Link
              href="/create"
              className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Open a market →
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              View source
            </a>
            <div className="ml-auto">
              <UsdcBalance />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Feature title="AI Copilot" desc="Natural language → YES/NO spec" />
            <Feature title="Vault backstop" desc="Instant fills on empty books" />
            <Feature title="Optimistic oracle" desc="Bond, challenge, finalize" />
            <Feature title="On Solana" desc="Sub-second, sub-cent" />
          </div>
        </div>
      </section>

      <section className="w-full max-w-5xl px-6 py-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Live markets</h2>
          <Link
            href="/create"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            + open one
          </Link>
        </div>
        <MarketList />
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur px-3 py-2.5">
      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
        {title}
      </div>
      <div className="mt-0.5 text-[11px] text-zinc-500 leading-tight">
        {desc}
      </div>
    </div>
  );
}
