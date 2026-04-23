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

export function CategoryPills() {
  const [active, setActive] = useState("All");

  return (
    <div className="no-scrollbar flex flex-wrap gap-2 overflow-x-auto">
      {CATEGORIES.map((c) => {
        const isActive = c === active;
        return (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={
              isActive
                ? "rounded-full bg-[color:var(--ps-blue)] px-4 py-1.5 text-sm font-semibold text-white shadow-ps-2 transition"
                : "rounded-full border border-[color:var(--ps-divider)] bg-white px-4 py-1.5 text-sm font-medium text-[color:var(--ps-body-gray)] transition hover:border-[color:var(--ps-blue)] hover:text-[color:var(--ps-blue)]"
            }
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
