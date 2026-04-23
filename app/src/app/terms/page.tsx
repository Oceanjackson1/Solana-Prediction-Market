export default function TermsPage() {
  return (
    <main className="flex flex-1 w-full flex-col surface-ps-light">
      <section className="mx-auto w-full max-w-2xl px-6 py-20">
        <h1 className="text-[44px] font-light leading-[1.15] tracking-[-0.1px] text-[color:var(--ps-display-ink)]">
          Terms of use
        </h1>
        <p className="mt-3 text-xs text-[color:var(--ps-body-gray)]">
          Last updated: 2026-04-20 · devnet prototype
        </p>

        <div className="mt-10 space-y-6 text-[color:var(--ps-charcoal)] leading-[1.6]">
          <Section title="1. Nature of service">
            Arena is a decentralized prediction market protocol running on
            Solana. This interface is a reference frontend. Smart contracts
            are open source under MIT license.
          </Section>

          <Section title="2. Devnet status">
            This deployment runs on Solana devnet with test USDC. No real
            funds are at risk. Market outcomes on devnet are for
            demonstration only and carry no real-world settlement.
          </Section>

          <Section title="3. Self-custody">
            You interact with Arena through your own Solana wallet. Arena
            never takes custody of your funds. All transactions are signed
            by you and executed on-chain.
          </Section>

          <Section title="4. No advice">
            Nothing on Arena constitutes financial, legal, or investment
            advice. Markets reflect the views of participants — not a
            prediction of what will actually happen.
          </Section>

          <Section title="5. Prohibited markets">
            The AI copilot refuses markets about specific individuals&apos;
            death, injury, or arrest; any markets involving minors; and
            markets that would violate applicable law. Human review may
            remove additional markets.
          </Section>

          <Section title="6. No warranty">
            This is a hackathon prototype. Provided &ldquo;as-is&rdquo;
            without warranty of any kind. You use Arena at your own risk.
          </Section>

          <Section title="7. Jurisdiction">
            Access may be restricted in jurisdictions where online
            prediction markets are prohibited. It is your responsibility to
            comply with your local laws.
          </Section>
        </div>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-medium text-[color:var(--ps-charcoal)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--ps-body-gray)] leading-[1.6]">
        {children}
      </p>
    </div>
  );
}
