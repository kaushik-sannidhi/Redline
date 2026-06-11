"use client";

import { useMemo, useState } from "react";
import type { Finding, FindingSeverity, ScanSummary } from "@/lib/types";
import { SeverityFilter } from "@/components/SeverityFilter";
import { FindingCard } from "@/components/FindingCard";

export function ReportFindings({ findings, stack, summary }: { findings: Finding[]; stack: string[]; summary: ScanSummary }) {
  const [active, setActive] = useState<"all" | FindingSeverity>("all");
  const filtered = useMemo(
    () => (active === "all" ? findings : findings.filter((finding) => finding.severity === active)),
    [active, findings]
  );

  return (
    <section>
      <SeverityFilter
        active={active}
        onChange={setActive}
        counts={{ all: summary.total, critical: summary.critical, high: summary.high, medium: summary.medium, low: summary.low }}
      />
      <div className="mt-5 space-y-4">
        {filtered.length ? (
          filtered.map((finding, index) => <FindingCard finding={finding} key={`${finding.id}-${index}`} stack={stack} />)
        ) : (
          <p className="rounded border border-line bg-white p-5 text-sm text-gray-600">No findings in this severity.</p>
        )}
      </div>
    </section>
  );
}
