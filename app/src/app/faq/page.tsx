import Link from "next/link";

const QA: { q: string; a: string }[] = [
  {
    q: "What is Arena?",
    a: "A prediction market on Solana. You bet on whether a future event will happen (YES) or not (NO). When the event resolves, winning side holders redeem 1 USDC per winning token.",
  },
  {
    q: "Do I need real money?",
    a: "Not on devnet. Grab free test USDC from the SPL token faucet linked in the footer. Mainnet deployment will use real USDC.",
  },
  {
    q: "How does a market resolve?",
    a: "After a market closes, anyone can stake a bond and propose the outcome (YES / NO / INVALID). There's a 72-hour challenge window — if no one challenges, the market settles to that outcome. Challenges trigger community arbitration.",
  },
  {
    q: "Why does the order book have 'vault' fills mixed in?",
    a: "Long-tail markets often have no other trader on the other side. Arena's vault is an automated market maker that provides liquidity when the order book is thin, so your bet always clears instantly.",
  },
  {
    q: "Can I open my own market?",
    a: "Yes — click 'Open market' in the header. You describe the question in natural language; our AI copilot (Claude / DeepSeek) writes the resolution criteria. You review, edit, and sign on-chain.",
  },
  {
    q: "What's the fee?",
    a: "30 bps (0.3%) on vault-backed trades. CLOB matches between two real users have no protocol fee. Solana network fees are ~$0.0001 per transaction.",
  },
  {
    q: "Is this safe?",
    a: "Programs are open source and unit-tested (15 passing tests). This is a hackathon submission, not an audited production system — devnet only. Don't put real money in until we publish an audit.",
  },
  {
    q: "Who built this?",
    a: "Submitted to Colosseum Frontier 2026. Built with Anchor + Next.js + Claude/DeepSeek. See 'Open source' link in the footer.",
  },
];

export default function FaqPage() {
  return (
    <main className="flex flex-1 w-full flex-col surface-ps-light">
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <h1 className="text-[44px] font-light leading-[1.15] tracking-[-0.1px] text-[color:var(--ps-display-ink)]">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-[color:var(--ps-body-gray)] font-light">
          Still have questions?{" "}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--ps-blue)] hover:text-[color:var(--ps-cyan)] transition"
          >
            Ping us on X
          </a>
          .
        </p>

        <dl className="mt-12 space-y-5">
          {QA.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-[12px] bg-white p-6 shadow-ps-1 open:shadow-ps-2 transition"
            >
              <summary className="cursor-pointer text-lg font-medium text-[color:var(--ps-charcoal)] leading-[1.3] list-none flex items-center justify-between">
                {q}
                <span className="text-[color:var(--ps-blue)] text-xl font-light group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm text-[color:var(--ps-body-gray)] leading-[1.6]">
                {a}
              </p>
            </details>
          ))}
        </dl>

        <div className="mt-16 text-center">
          <Link href="/" className="btn-ps-primary">
            Browse markets
          </Link>
        </div>
      </section>
    </main>
  );
}
