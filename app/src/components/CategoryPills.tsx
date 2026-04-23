"use client";

import { useState } from "react";

const CATEGORIES = [
  "All",
  "Sports",
  "Politics",
  "Crypto",
  "AI",
  "Culture",
  "Economy",
];

// Editorial underline-link style — the old filled pill looked too
// toolbar-y. This reads more like magazine section navigation.
export function CategoryPills() {
  const [active, setActive] = useState("All");

  return (
    <div className="no-scrollbar flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[color:var(--ps-divider)] pb-3 overflow-x-auto">
      {CATEGORIES.map((c) => {
        const isActive = c === active;
        return (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={
              isActive
                ? "relative pb-2 text-sm font-semibold tracking-wide text-[color:var(--ps-display-ink)] after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-[2px] after:bg-[color:var(--ps-blue)]"
                : "pb-2 text-sm font-light tracking-wide text-[color:var(--ps-body-gray)] transition hover:text-[color:var(--ps-charcoal)]"
            }
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
