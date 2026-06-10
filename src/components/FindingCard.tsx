"use client";

import { useState } from "react";
import type { Finding } from "@/lib/types";
import { track } from "@/lib/analytics";

const severityClass = {
  critical: "bg-danger text-white",
  high: "bg-orange-100 text-orange-900",
  medium: "bg-yellow-100 text-yellow-900",
  low: "bg-green-100 text-green-900"
};

export function FindingCard({ finding }: { finding: Finding }) {
  const [copied, setCopied] = useState(false);
  const [requested, setRequested] = useState(false);

  async function copyFix() {
    await navigator.clipboard.writeText(finding.fix);
    setCopied(true);
    track("fix_copied", { finding_id: finding.id, severity: finding.severity });
    setTimeout(() => setCopied(false), 1600);
  }

  function requestAiFix() {
    setRequested(true);
    track("ai_fix_requested", { finding_id: finding.id });
  }

  return (
    <article className="rounded border border-line bg-white p-5 shadow-crisp">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`rounded px-2 py-1 text-xs font-black uppercase tracking-wide ${severityClass[finding.severity]}`}>
            {finding.severity}
          </span>
          <h3 className="mt-3 text-xl font-black text-ink">{finding.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded border border-line px-3 py-2 text-sm font-semibold hover:border-ink"
            onClick={requestAiFix}
            type="button"
          >
            {requested ? "Requested" : "Fix it for me"}
          </button>
          <button
            className="rounded bg-ink px-3 py-2 text-sm font-semibold text-white"
            onClick={copyFix}
            type="button"
          >
            {copied ? "Copied" : "Copy fix"}
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">What</p>
          <p className="mt-1 text-sm leading-6 text-gray-700">{finding.what}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Why it matters</p>
          <p className="mt-1 text-sm leading-6 text-gray-700">{finding.why}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Fix</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{finding.fix}</p>
        </div>
      </div>
      {finding.evidence || finding.affected?.length ? (
        <div className="mt-4 rounded bg-paper p-3 text-xs text-gray-600">
          {finding.evidence ? <p>Evidence: {finding.evidence}</p> : null}
          {finding.affected?.length ? <p>Affected: {finding.affected.join(", ")}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
