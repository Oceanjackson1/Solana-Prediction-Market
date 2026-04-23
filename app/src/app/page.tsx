import { MarketList } from "@/components/MarketList";
import { FeaturedMarketCard } from "@/components/FeaturedMarketCard";
import { CategoryPills } from "@/components/CategoryPills";
import { HeroBackground } from "@/components/HeroBackground";
import { TickerStrip } from "@/components/TickerStrip";
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
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-black min-h-[92vh] flex flex-col text-white">
        {/* Ambient animated background — aurora blobs + grid + grain */}
        <HeroBackground />

        {/* Corner crop marks — editorial "print proof" feel */}
        <span className="crop-mark crop-tl" aria-hidden />
        <span className="crop-mark crop-tr" aria-hidden />
        <span className="crop-mark crop-bl" aria-hidden />
        <span className="crop-mark crop-br" aria-hidden />

        {/* Top-left wordmark caption */}
        <div className="absolute top-8 left-12 z-20 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
          A R E N A <span className="mx-3 text-white/25">/</span> v 0.1
        </div>

        {/* Main grid */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 items-center px-12 pt-28 pb-24">
          <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,640px)_minmax(0,460px)] lg:items-center">
            {/* Left column — editorial copy */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur px-3 py-1 text-[11px] font-medium tracking-wide text-white/85">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--ps-cyan)] opacity-70 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--ps-cyan)]" />
                </span>
                Live on Solana devnet · Free test USDC
              </span>
              <h1 className="mt-7 font-semibold leading-[1.02] tracking-[-0.025em] text-white text-[clamp(42px,5.4vw,64px)]">
                Bet on anything.
                <br />
                <span className="title-shimmer">Settled on Solana.</span>
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] font-light leading-[1.55] text-white/70">
                A prediction market for the long tail of events — from World
                Cup finals to AI milestones. One click, one second, one Solana
                wallet.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="#markets"
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[color:var(--ps-black)] transition hover:bg-[color:var(--ps-cyan)] hover:text-white hover:scale-[1.03] shadow-[0_0_40px_-10px_rgba(30,174,219,0.8)]"
                >
                  Browse markets
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center rounded-full border border-white/30 bg-white/5 backdrop-blur px-6 py-3 text-[15px] font-medium text-white/90 transition hover:border-white hover:bg-white/10 hover:text-white"
                >
                  How it works
                </Link>
              </div>
            </div>

            {/* Right column — floating featured market card */}
            <div className="relative hidden lg:flex justify-end">
              {/* glow bloom behind card */}
              <div className="pointer-events-none absolute inset-0 -m-8 rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(30,174,219,0.35),transparent_70%)] blur-2xl" />
              <div className="relative animate-float-card">
                <FeaturedMarketCard />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-anchor row: tagline + inline metrics */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-wrap items-end justify-between gap-6 px-12 pb-10">
          <p className="max-w-[260px] text-[13px] font-light leading-[1.45] text-white/55">
            Predict any event · trade in a second · never trust a custodian.
          </p>
          <div className="flex flex-wrap items-end gap-10">
            <Metric value="99%" label="Settled on-chain" />
            <Metric value="1s" label="Trade clears" />
            <Metric value="$0.0001" label="Avg Solana fee" />
          </div>
        </div>

        {/* Mobile floating card */}
        <div className="relative z-10 px-12 pb-10 lg:hidden">
          <FeaturedMarketCard />
        </div>

        {/* Ticker at bottom of hero — live terminal pulse */}
        <div className="relative z-10">
          <TickerStrip />
        </div>
      </section>

      {/* ============ BUILT WITH strip ============ */}
      <div className="bg-black border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-10 gap-y-4 px-12 py-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
            Built with
          </span>
          <TechMark label="Solana" />
          <TechMark label="Anchor" />
          <TechMark label="Next.js" />
          <TechMark label="DeepSeek" />
          <TechMark label="Phantom" />
          <TechMark label="Helius" />
        </div>
      </div>

      {/* ============ 01 · LIVE MARKETS ============ */}
      <section id="markets" className="surface-ps-light">
        <div className="mx-auto w-full max-w-[1200px] px-12 py-20">
          <div className="eyebrow">
            <span className="eyebrow-num">01</span>
            <span className="eyebrow-kicker">Live markets</span>
          </div>
          <h2 className="display-h2">Trade the long tail of prediction.</h2>
          <p className="mt-3 max-w-xl text-[color:var(--ps-body-gray)] font-light leading-[1.55]">
            Markets Polymarket won't list — sports, politics, crypto,
            culture. Open your own or pick one already running.
          </p>

          {/* Featured pin */}
          <div className="mt-12 grid gap-10 rounded-[16px] border border-[color:var(--ps-divider)] bg-white p-8 lg:grid-cols-[1fr_minmax(0,360px)] lg:items-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ps-blue)]">
                Market of the week
              </span>
              <h3 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-[color:var(--ps-display-ink)]">
                Argentina × World Cup 2026 final
              </h3>
              <p className="mt-3 text-[15px] font-light leading-[1.55] text-[color:var(--ps-body-gray)]">
                Our most-watched market this week. YES pays 1 USDC per token
                if Argentina lifts the trophy on July 19, 2026.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#markets-grid"
                  className="inline-flex items-center rounded-full bg-[color:var(--ps-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--ps-cyan)] hover:scale-[1.03]"
                >
                  See the book
                </Link>
                <span className="text-xs text-[color:var(--ps-body-gray)] self-center">
                  Closes in 3 months · $2.4M volume
                </span>
              </div>
            </div>
            <div className="lg:justify-self-end">
              <FeaturedMarketCard />
            </div>
          </div>

          <div className="mt-14 mb-6">
            <CategoryPills />
          </div>

          <div id="markets-grid">
            <MarketList />
          </div>
        </div>
      </section>

      {/* ============ 02 · WHY ARENA ============ */}
      <section className="surface-ps-light border-t border-[color:var(--ps-divider)]">
        <div className="mx-auto w-full max-w-[1200px] px-12 py-20">
          <div className="eyebrow">
            <span className="eyebrow-num">02</span>
            <span className="eyebrow-kicker">Why Arena</span>
          </div>
          <h2 className="display-h2">Built for traders, not middlemen.</h2>
          <p className="mt-3 max-w-xl text-[color:var(--ps-body-gray)] font-light leading-[1.55]">
            Every design choice is in your favor — self-custody, instant
            clears, transparent resolution, near-zero fees.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
              desc="Solana makes sub-dollar positions practical — unlike every EVM market."
            />
          </div>
        </div>
      </section>

      {/* ============ 03 · HOW IT WORKS ============ */}
      <section
        id="how-it-works"
        className="surface-ps-light border-t border-[color:var(--ps-divider)]"
      >
        <div className="mx-auto w-full max-w-[1200px] px-12 py-20">
          <div className="eyebrow">
            <span className="eyebrow-num">03</span>
            <span className="eyebrow-kicker">How it works</span>
          </div>
          <h2 className="display-h2">Three steps to your first bet.</h2>
          <p className="mt-3 max-w-xl text-[color:var(--ps-body-gray)] font-light leading-[1.55]">
            No sign-up, no KYC, no email. Just a Solana wallet and free test
            USDC from the faucet.
          </p>

          <div className="relative mt-12 grid gap-6 sm:grid-cols-3">
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

      {/* ============ 04 · EARN ============ */}
      <section className="surface-ps-light border-t border-[color:var(--ps-divider)]">
        <div className="mx-auto w-full max-w-[1200px] px-12 py-20">
          <div className="eyebrow">
            <span className="eyebrow-num">04</span>
            <span className="eyebrow-kicker">Earn</span>
          </div>
          <div className="mt-4 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <h2 className="display-h2">Earn fees from every trade.</h2>
              <p className="mt-3 max-w-xl text-[color:var(--ps-body-gray)] font-light leading-[1.55]">
                Deposit USDC into a market vault, earn 30 bps on every trade
                that clears through it. Withdraw any time.
              </p>
            </div>
            <Link
              href="/earn"
              className="inline-flex items-center gap-1 rounded-full bg-[color:var(--ps-blue)] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[color:var(--ps-cyan)] hover:scale-[1.03]"
            >
              Earn passive yield
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="surface-ps-brand">
        <div className="mx-auto w-full max-w-[1200px] px-12 py-16">
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

            <FooterCol
              title="Product"
              items={[
                { label: "Browse markets", href: "#markets" },
                { label: "How it works", href: "#how-it-works" },
                { label: "Earn", href: "/earn" },
                { label: "Open a market", href: "/create" },
              ]}
            />

            <FooterCol
              title="Help"
              items={[
                { label: "FAQ", href: "/faq" },
                { label: "Terms", href: "/terms" },
                {
                  label: "Get test USDC",
                  href: "https://spl-token-faucet.com/?token-name=USDC-Dev",
                  external: true,
                },
              ]}
            />

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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[32px] font-semibold leading-none tracking-tight text-white tabular-nums">
        {value}
      </div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
        {label}
      </div>
    </div>
  );
}

function TechMark({ label }: { label: string }) {
  return (
    <span className="text-[13px] font-light tracking-[0.08em] text-white/70 transition hover:text-white">
      {label}
    </span>
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
    <div className="group rounded-[12px] border border-[color:var(--ps-divider)] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[color:var(--ps-blue)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[color:var(--ps-blue)]/10 text-[color:var(--ps-blue)] transition group-hover:bg-[color:var(--ps-blue)] group-hover:text-white">
        <Icon size={18} strokeWidth={2} />
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-[color:var(--ps-charcoal)]">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-[color:var(--ps-body-gray)] leading-[1.55] font-light">
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
    <div className="relative rounded-[12px] border border-[color:var(--ps-divider)] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="text-[54px] font-semibold leading-none tracking-tight text-[color:var(--ps-blue)]/15">
          {n}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ps-blue)] text-white">
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold leading-[1.2] tracking-tight text-[color:var(--ps-display-ink)]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[color:var(--ps-body-gray)] leading-[1.55] font-light">
        {desc}
      </p>
    </div>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
        {title}
      </div>
      <ul className="space-y-2 font-light text-white/80 text-sm">
        {items.map((item) =>
          item.external ? (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                {item.label}
              </a>
            </li>
          ) : (
            <li key={item.label}>
              <Link
                href={item.href}
                className="hover:text-white transition"
              >
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
