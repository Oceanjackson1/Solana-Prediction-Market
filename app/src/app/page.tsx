import { UsdcBalance } from "@/components/UsdcBalance";
import { MarketList } from "@/components/MarketList";
import { StatsStrip } from "@/components/StatsStrip";
import { FeaturedMarketCard } from "@/components/FeaturedMarketCard";
import { CategoryPills } from "@/components/CategoryPills";
import Link from "next/link";
import {
  Target,
  Zap,
  ShieldCheck,
  Coins,
  Wallet,
  TrendingUp,
  Trophy,
  MessageCircle,
  ArrowUpRight,
  Code2,
  Hash,
  type LucideIcon,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 w-full flex-col">
      {/* Masthead — PS dark hero with ambient glow */}
      <section className="relative overflow-hidden surface-ps-dark">
        {/* ambient radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[color:var(--ps-blue)] opacity-30 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[color:var(--ps-cyan)] opacity-15 blur-[120px]"
        />

        <div className="relative mx-auto w-full max-w-5xl px-6 pt-20 pb-16 sm:pt-28">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            {/* Left column */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur px-3 py-1 text-xs font-medium text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ps-cyan)] animate-pulse" />
                Live on Solana · Free test USDC
              </span>
              <h1 className="mt-6 max-w-3xl text-5xl font-light leading-[1.1] tracking-[-0.1px] text-white sm:text-[54px]">
                Bet on anything.
                <br />
                <span className="text-[color:var(--ps-cyan)]">Settled on Solana.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg font-light leading-[1.5] text-white/70">
                From World Cup finals to AI milestones — trade any prediction
                with one click. Your bet settles automatically when the event
                resolves.
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
                <div className="hidden sm:block">
                  <UsdcBalance />
                </div>
              </div>
            </div>

            {/* Right column — product preview */}
            <div className="flex justify-center lg:justify-end">
              <FeaturedMarketCard />
            </div>
          </div>

          <StatsStrip />
        </div>
      </section>

      {/* Category filters + Live markets */}
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
          <div className="mb-6">
            <CategoryPills />
          </div>
          <MarketList />
        </div>
      </section>

      {/* Feature strip — why Arena */}
      <section className="surface-ps-light border-t border-[color:var(--ps-divider)]">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-[28px] font-light leading-[1.25] tracking-[0.1px] text-[color:var(--ps-display-ink)]">
            Why Arena
          </h2>
          <p className="mt-2 max-w-xl text-[color:var(--ps-body-gray)] font-light">
            A prediction market designed for traders who want speed, fairness,
            and self-custody — not a middleman.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Target}
              title="Bet on anything"
              desc="Sports, politics, crypto, culture — or open your own market in 60 seconds."
            />
            <FeatureCard
              icon={Zap}
              title="Always a counterparty"
              desc="Thin order book? A vault steps in. Trades clear in a second."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Transparent resolution"
              desc="Outcomes settled by verified sources with a community challenge window."
            />
            <FeatureCard
              icon={Coins}
              title="Near-zero fees"
              desc="Solana makes it practical to trade sub-dollar positions."
            />
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[color:var(--ps-divider)] pt-8 text-xs font-medium uppercase tracking-wider text-[color:var(--ps-body-gray)]">
            <span>Submitted to Colosseum Frontier 2026</span>
            <span className="h-1 w-1 rounded-full bg-[color:var(--ps-mute)]" />
            <span>Built on Solana</span>
            <span className="h-1 w-1 rounded-full bg-[color:var(--ps-mute)]" />
            <span>AI Copilot powered by DeepSeek</span>
            <span className="h-1 w-1 rounded-full bg-[color:var(--ps-mute)]" />
            <span>Open source · MIT</span>
          </div>
        </div>
      </section>

      {/* How it works — PS light content panel */}
      <section
        id="how-it-works"
        className="surface-ps-light border-t border-[color:var(--ps-divider)]"
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-[28px] font-light leading-[1.25] tracking-[0.1px] text-[color:var(--ps-display-ink)]">
            Three steps to your first bet
          </h2>
          <p className="mt-2 max-w-xl text-[color:var(--ps-body-gray)] font-light">
            No sign-up form. No KYC. Just a Solana wallet and test USDC from
            the faucet.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3 relative">
            {/* dashed connector between steps (desktop only) */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-10 left-[16.66%] right-[16.66%] hidden border-t-2 border-dashed border-[color:var(--ps-mute)] sm:block"
            />
            <Step
              n="1"
              icon={Wallet}
              title="Connect"
              desc="Click Connect Wallet. Phantom, Solflare, or Backpack all work. We never ask for your email."
            />
            <Step
              n="2"
              icon={TrendingUp}
              title="Pick a market"
              desc="Browse live markets. Every market is a clean YES/NO question — no complicated odds."
            />
            <Step
              n="3"
              icon={Trophy}
              title="Collect"
              desc="Winning token holders get 1 USDC per token when the event resolves. That's it."
            />
          </div>
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
            <Link
              href="/earn"
              className="btn-ps-primary justify-self-start sm:justify-self-end"
            >
              Earn passive yield
            </Link>
          </div>
        </div>
      </section>

      {/* Footer — PS brand anchor */}
      <footer className="surface-ps-brand">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-6 w-6 rounded-full bg-white" />
                <span className="font-light text-xl tracking-tight">Arena</span>
              </div>
              <p className="mt-4 max-w-xs text-sm font-light leading-[1.5] text-white/80">
                Predict any event. Trade in a second. Settle on Solana.
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                Product
              </div>
              <ul className="space-y-2 font-light text-white/80 text-sm">
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
              <ul className="space-y-2 font-light text-white/80 text-sm">
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
              <ul className="space-y-2 font-light text-white/80 text-sm">
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white transition"
                  >
                    <Hash size={14} />X · @arena
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white transition"
                  >
                    <MessageCircle size={14} />
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Oceanjackson1/Solana-Prediction-Market"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white transition"
                  >
                    <Code2 size={14} />
                    GitHub
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
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              Open source
              <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-[12px] bg-white p-6 shadow-ps-1 transition hover:shadow-ps-3 hover:-translate-y-0.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[color:var(--ps-blue)]/10 text-[color:var(--ps-blue)] transition group-hover:bg-[color:var(--ps-blue)] group-hover:text-white">
        <Icon size={18} strokeWidth={2} />
      </div>
      <h3 className="mt-4 text-lg font-medium leading-snug text-[color:var(--ps-charcoal)]">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-[color:var(--ps-body-gray)] leading-[1.5]">
        {desc}
      </p>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  desc,
}: {
  n: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-[12px] bg-white p-6 shadow-ps-1">
      <div className="flex items-center gap-3">
        <span className="text-[54px] font-light leading-none tracking-tight text-[color:var(--ps-blue)]/15">
          {n}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ps-blue)] text-white">
          <Icon size={18} strokeWidth={2} />
        </span>
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
