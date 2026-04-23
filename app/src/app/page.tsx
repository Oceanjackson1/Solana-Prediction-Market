import { UsdcBalance } from "@/components/UsdcBalance";
import { MarketList } from "@/components/MarketList";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 w-full flex-col">
      {/* Masthead — PS dark hero */}
      <section className="surface-ps-dark">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-cyan)] animate-pulse" />
            Colosseum Frontier · devnet
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-light leading-[1.15] tracking-[-0.1px] text-white sm:text-[54px]">
            Prediction markets for the long tail.
          </h1>
          <p className="mt-5 max-w-xl text-lg font-light leading-[1.5] text-white/70">
            Open any market with an AI copilot. A Solana vault backstops thin
            order books so trades clear instantly — no cold-start problem.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 items-center">
            <Link href="/create" className="btn-ps-primary">
              Open a market
            </Link>
            <a
              href="https://github.com/Oceanjackson1/Solana-Prediction-Market"
              target="_blank"
              rel="noreferrer"
              className="btn-ps-ghost border-white/30 !text-white/90 hover:!text-white"
            >
              View source
            </a>
            <div className="ml-auto">
              <UsdcBalance />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Feature title="AI Copilot" desc="Natural language → YES/NO spec" />
            <Feature
              title="Vault backstop"
              desc="Instant fills on empty books"
            />
            <Feature
              title="Optimistic oracle"
              desc="Bond, challenge, finalize"
            />
            <Feature title="On Solana" desc="Sub-second, sub-cent" />
          </div>
        </div>
      </section>

      {/* Live markets — PS light content panel */}
      <section className="surface-ps-light">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-[28px] font-light leading-[1.25] tracking-[0.1px] text-[color:var(--ps-display-ink)]">
              Live markets
            </h2>
            <Link
              href="/create"
              className="text-sm font-medium text-[color:var(--ps-link-dark)] hover:text-[color:var(--ps-cyan)] transition"
            >
              + open one
            </Link>
          </div>
          <MarketList />
        </div>
      </section>

      {/* Footer — PS brand anchor */}
      <footer className="surface-ps-brand">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-full bg-white" />
            <span className="font-light text-xl tracking-tight">Arena</span>
          </div>
          <p className="mt-4 max-w-md text-sm font-light leading-[1.5] text-white/80">
            UGC prediction markets on Solana. Colosseum Frontier 2026
            submission.
          </p>
          <div className="mt-8 flex flex-wrap gap-5 text-xs text-white/70">
            <a
              href="https://github.com/Oceanjackson1/Solana-Prediction-Market"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              GitHub
            </a>
            <Link href="/create" className="hover:text-white transition">
              Open market
            </Link>
            <a
              href="https://github.com/Oceanjackson1/Solana-Prediction-Market/blob/main/docs/pitch-deck.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Pitch deck
            </a>
            <a
              href="https://github.com/Oceanjackson1/Solana-Prediction-Market/blob/main/docs/whitepaper-lite.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Whitepaper
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/5 backdrop-blur px-3 py-2.5">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-0.5 text-[11px] text-white/60 leading-tight">
        {desc}
      </div>
    </div>
  );
}
