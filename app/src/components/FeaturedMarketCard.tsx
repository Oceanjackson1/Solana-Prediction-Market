import { Clock, TrendingUp } from "lucide-react";

// Hero-side mock card — lets first-time visitors see what a market
// actually looks like before they scroll. Uses a realistic example
// so the preview reads as a product, not a placeholder.
export function FeaturedMarketCard() {
  const yes = 68;
  const no = 100 - yes;

  return (
    <div className="relative w-full max-w-sm">
      {/* soft glow */}
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] bg-[color:var(--ps-blue)]/20 blur-2xl" />

      <div className="rounded-[18px] bg-white p-6 shadow-ps-hero">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-[3px] bg-[color:var(--ps-blue)]/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ps-blue)]">
            Sports
          </span>
          <span className="flex items-center gap-1 text-[color:var(--ps-body-gray)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <h3 className="mt-3 text-lg font-medium leading-snug text-[color:var(--ps-charcoal)]">
          Will Argentina win the 2026 FIFA World Cup final?
        </h3>

        {/* Probability bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-emerald-700">YES {yes}¢</span>
            <span className="text-rose-600">NO {no}¢</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-rose-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${yes}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-[8px] bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Buy YES · 68¢
          </button>
          <button
            type="button"
            className="rounded-[8px] bg-rose-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            Buy NO · 32¢
          </button>
        </div>

        {/* Meta row */}
        <div className="mt-4 flex items-center justify-between border-t border-[color:var(--ps-divider)] pt-3 text-xs text-[color:var(--ps-body-gray)]">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Closes 19 Jul 2026
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <TrendingUp size={12} />
            $2.4M vol
          </span>
        </div>
      </div>
    </div>
  );
}
