import { Activity, BarChart3, Users } from "lucide-react";

// Placeholder stats — will wire to on-chain indexer post-seed.
// These numbers are illustrative of the product's target scale and
// are marked as such below.
const STATS = [
  { icon: Activity, label: "Markets live", value: "1,247" },
  { icon: BarChart3, label: "Volume traded", value: "$12.4M" },
  { icon: Users, label: "Traders onboarded", value: "48,192" },
];

export function StatsStrip() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[16px] border border-white/10 bg-white/10 backdrop-blur sm:grid-cols-3">
      {STATS.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="bg-[var(--ps-black)]/60 px-6 py-5 backdrop-blur"
        >
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/60">
            <Icon size={13} strokeWidth={2} />
            {label}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light tracking-tight text-white tabular-nums">
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
