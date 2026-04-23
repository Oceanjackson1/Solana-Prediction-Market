import { TrendingUp, TrendingDown } from "lucide-react";

// Scrolling market ticker — lives at the bottom of the hero to give
// the page a live "terminal" pulse. Data is illustrative (no indexer
// yet). Duplicated once so the CSS marquee loops seamlessly.

type TickerItem = {
  q: string;
  price: number;
  delta: number;
  cat: string;
};

const ITEMS: TickerItem[] = [
  { q: "Argentina win WC 2026", price: 68, delta: +4, cat: "Sports" },
  { q: "BTC > $120k by EOY", price: 42, delta: -2, cat: "Crypto" },
  { q: "GPT-6 released in 2026", price: 33, delta: +1, cat: "AI" },
  { q: "SOL > $500 on Dec 31", price: 25, delta: -3, cat: "Crypto" },
  { q: "Fed cuts rates in June", price: 71, delta: +6, cat: "Economy" },
  { q: "Taylor Swift AOTY 2026", price: 18, delta: -1, cat: "Culture" },
  { q: "Lakers make 2026 Finals", price: 39, delta: +2, cat: "Sports" },
  { q: "Apple ships AR glasses 2026", price: 22, delta: 0, cat: "Culture" },
];

export function TickerStrip() {
  // Duplicate for seamless CSS infinite scroll
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-black/40 backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />

      <div className="flex items-center gap-0 whitespace-nowrap animate-ticker">
        {loop.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 border-r border-white/10 px-6 py-3 text-[13px]"
          >
            <span className="rounded-[3px] bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {item.cat}
            </span>
            <span className="text-white/70 font-light">{item.q}</span>
            <span className="font-mono tabular-nums font-semibold text-white">
              {item.price}¢
            </span>
            <span
              className={
                "inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums " +
                (item.delta > 0
                  ? "text-emerald-400"
                  : item.delta < 0
                    ? "text-rose-400"
                    : "text-white/40")
              }
            >
              {item.delta > 0 ? (
                <TrendingUp size={11} />
              ) : item.delta < 0 ? (
                <TrendingDown size={11} />
              ) : null}
              {item.delta > 0 ? "+" : ""}
              {item.delta}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
