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
            Live on Solana · Free test USDC
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-light leading-[1.15] tracking-[-0.1px] text-white sm:text-[54px]">
            Bet on anything. Settled on Solana.
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-light leading-[1.5] text-white/70">
            From World Cup finals to AI milestones — trade any prediction with
            one click. Your bet settles automatically when the event resolves.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 items-center">
            <Link href="#markets" className="btn-ps-primary">
              Browse markets
            </Link>
            <Link
              href="#how-it-works"
              className="btn-ps-ghost border-white/30 !text-white/90 hover:!text-white"
            >
              How it works
            </Link>
            <div className="ml-auto">
              <UsdcBalance />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Feature
              title="Bet on anything"
              desc="Sports, politics, crypto, culture"
            />
            <Feature
              title="Always a counterparty"
              desc="Trades clear in a second"
            />
            <Feature
              title="Transparent resolution"
              desc="Settled by verified sources"
            />
            <Feature
              title="Near-zero fees"
              desc="Under $0.01 per trade"
            />
          </div>
        </div>
      </section>

      {/* How it works — PS light content panel */}
      <section id="how-it-works" className="surface-ps-light border-b border-[color:var(--ps-divider)]">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-[28px] font-light leading-[1.25] tracking-[0.1px] text-[color:var(--ps-display-ink)]">
            Three steps to your first bet
          </h2>
          <p className="mt-2 max-w-xl text-[color:var(--ps-body-gray)] font-light">
            No sign-up form. No KYC. Just a Solana wallet and test USDC from
            the faucet.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Step
              n="1"
              title="Connect"
              desc="Click the top-right Connect Wallet. Phantom, Solflare, or Backpack all work. We'll never ask for your email."
            />
            <Step
              n="2"
              title="Pick a market"
              desc="Browse live markets below. Every market is a clean YES/NO question — no complicated odds."
            />
            <Step
              n="3"
              title="Collect"
              desc="Winning token holders get 1 USDC per token when the event resolves. That's it. No fine print."
            />
          </div>
        </div>
      </section>

      {/* Live markets */}
      <section id="markets" className="surface-ps-light">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-[28px] font-light leading-[1.25] tracking-[0.1px] text-[color:var(--ps-display-ink)]">
              Live markets
            </h2>
            <span className="text-xs text-[color:var(--ps-body-gray)]">
              devnet · free test USDC
            </span>
          </div>
          <MarketList />
        </div>
      </section>

      {/* Earn teaser */}
      <section className="surface-ps-light border-t border-[color:var(--ps-divider)]">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <span className="inline-block rounded-[3px] bg-[color:var(--ps-blue)]/10 px-2 py-0.5 text-[11px] font-medium text-[color:var(--ps-blue)]">
                For liquidity providers
              </span>
              <h2 className="mt-3 text-[28px] font-light leading-[1.25] tracking-[0.1px] text-[color:var(--ps-display-ink)]">
                Earn fees from every trade.
              </h2>
              <p className="mt-2 max-w-xl text-[color:var(--ps-body-gray)] font-light">
                Deposit USDC into a market vault, earn 30 bps on every trade
                that clears through it. Withdraw any time.
              </p>
            </div>
            <Link href="/earn" className="btn-ps-primary justify-self-start sm:justify-self-end">
              Earn passive yield
            </Link>
          </div>
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
            Predict any event. Trade in a second. Settle on Solana.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-3 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Product
              </div>
              <ul className="space-y-2 font-light text-white/80">
                <li>
                  <Link href="#markets" className="hover:text-white transition">
                    Browse markets
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-white transition">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/earn" className="hover:text-white transition">
                    Earn
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="hover:text-white transition">
                    Open a market
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Help
              </div>
              <ul className="space-y-2 font-light text-white/80">
                <li>
                  <Link href="/faq" className="hover:text-white transition">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms
                  </Link>
                </li>
                <li>
                  <a
                    href="https://spl-token-faucet.com/?token-name=USDC-Dev"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition"
                  >
                    Get test USDC
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Community
              </div>
              <ul className="space-y-2 font-light text-white/80">
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition"
                  >
                    X · @arena
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition"
                  >
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6 text-xs text-white/60 font-light">
            <span>© 2026 Arena. Built on Solana.</span>
            <a
              href="https://github.com/Oceanjackson1/Solana-Prediction-Market"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Open source ↗
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

function Step({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[12px] bg-white p-6 shadow-ps-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--ps-blue)] text-white text-sm font-semibold">
        {n}
      </div>
      <h3 className="mt-4 text-xl font-light leading-[1.25] text-[color:var(--ps-display-ink)]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[color:var(--ps-body-gray)] leading-[1.5]">
        {desc}
      </p>
    </div>
  );
}
