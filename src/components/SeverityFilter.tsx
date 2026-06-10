"use client";

import type { FindingSeverity } from "@/lib/types";

const filters: Array<"all" | FindingSeverity> = ["all", "critical", "high", "medium", "low"];

export function SeverityFilter({
  active,
  onChange,
  counts
}: {
  active: "all" | FindingSeverity;
  onChange: (value: "all" | FindingSeverity) => void;
  counts: Record<"all" | FindingSeverity, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          className={[
            "rounded border px-3 py-2 text-sm font-semibold capitalize",
            active === filter ? "border-ink bg-ink text-white" : "border-line bg-white text-gray-700 hover:border-ink"
          ].join(" ")}
          key={filter}
          onClick={() => onChange(filter)}
          type="button"
        >
          {filter} {counts[filter]}
        </button>
      ))}
    </div>
  );
}
