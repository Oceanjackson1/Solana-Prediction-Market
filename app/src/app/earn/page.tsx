import Link from "next/link";

export default function EarnPage() {
  return (
    <main className="flex flex-1 w-full flex-col surface-ps-light">
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <span className="inline-block rounded-[3px] bg-[color:var(--ps-blue)]/10 px-2 py-0.5 text-[11px] font-medium text-[color:var(--ps-blue)]">
          For liquidity providers
        </span>
        <h1 className="mt-4 text-[44px] font-light leading-[1.15] tracking-[-0.1px] text-[color:var(--ps-display-ink)]">
          Earn fees from every trade.
        </h1>
        <p className="mt-4 max-w-xl text-[color:var(--ps-body-gray)] font-light leading-[1.5]">
          Deposit USDC into a market&apos;s vault and earn 30 bps on every
          trade that routes through it. Your vLP token tracks your share of
          the pool — withdraw any time.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <Metric label="Vault fee" value="30 bps" />
          <Metric label="Withdraw" value="Any time" />
          <Metric label="Lock-up" value="None" />
        </div>

        <div className="mt-12 rounded-[12px] bg-white p-8 shadow-ps-1">
          <h2 className="text-[22px] font-light text-[color:var(--ps-display-ink)] leading-[1.25]">
            How it works
          </h2>
          <ol className="mt-6 space-y-4 text-sm text-[color:var(--ps-charcoal)]">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--ps-blue)] text-white text-xs font-semibold">
                1
              </span>
              <span>
                Pick a market you want to support. Market vaults backstop
                traders when the order book is thin.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--ps-blue)] text-white text-xs font-semibold">
                2
              </span>
              <span>
                Deposit USDC; receive vLP tokens proportional to your share
                of the pool.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--ps-blue)] text-white text-xs font-semibold">
                3
              </span>
              <span>
                Burn vLP anytime to withdraw your share of USDC + YES + NO
                reserves, plus your share of fees earned since your deposit.
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-10 rounded-[12px] border border-dashed border-[color:var(--ps-mute)] bg-white p-8 text-center">
          <p className="text-[color:var(--ps-charcoal)] font-light">
            Pool dashboards launch when markets deploy.
          </p>
          <p className="mt-2 text-sm text-[color:var(--ps-body-gray)]">
            Each vault lives at <code className="font-mono text-xs">/vault/[market]</code>.
            Find the link on any market&apos;s detail page.
          </p>
          <Link href="/" className="btn-ps-ghost mt-6">
            Browse markets
          </Link>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white p-5 shadow-ps-1">
      <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--ps-body-gray)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-light tracking-tight text-[color:var(--ps-display-ink)]">
        {value}
      </div>
    </div>
  );
}
