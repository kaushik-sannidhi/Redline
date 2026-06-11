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

export function FindingCard({ finding, stack }: { finding: Finding; stack: string[] }) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [aiFix, setAiFix] = useState("");
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState("");

  async function copyFix() {
    await navigator.clipboard.writeText(finding.fix);
    setCopied(true);
    track("fix_copied", { finding_id: finding.id, severity: finding.severity });
    setTimeout(() => setCopied(false), 1600);
  }

  async function requestAiFix() {
    setIsFixing(true);
    setFixError("");
    track("ai_fix_requested", { finding_id: finding.id });
    try {
      const response = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finding, stack })
      });
      const data = (await response.json()) as { fix?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not generate fix");
      setAiFix(data.fix ?? finding.fix);
    } catch (error) {
      setFixError(error instanceof Error ? error.message : "Could not generate fix");
    } finally {
      setIsFixing(false);
    }
  }

  return (
    <article className="rounded border border-line bg-white p-5 shadow-crisp">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => {
            setIsOpen((current) => !current);
            if (!isOpen) track("finding_expanded", { finding_id: finding.id, severity: finding.severity });
          }}
          type="button"
        >
          <span className={`rounded px-2 py-1 text-xs font-black uppercase tracking-wide ${severityClass[finding.severity]}`}>
            {finding.severity}
          </span>
          {finding.autoFixable ? (
            <span className="ml-2 rounded bg-paper px-2 py-1 text-xs font-black uppercase tracking-wide text-ink">Auto-fix available</span>
          ) : null}
          <h3 className="mt-3 text-xl font-black text-ink">{finding.title}</h3>
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded border border-line px-3 py-2 text-sm font-semibold hover:border-ink"
            onClick={requestAiFix}
            disabled={isFixing}
            type="button"
          >
            {isFixing ? "Writing..." : "Fix it for me"}
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
      {isOpen ? (
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
      ) : null}
      {isOpen && (finding.evidence || finding.affected?.length) ? (
        <div className="mt-4 rounded bg-paper p-3 text-xs text-gray-600">
          {finding.evidence ? <p>Evidence: {finding.evidence}</p> : null}
          {finding.affected?.length ? <p>Affected: {finding.affected.join(", ")}</p> : null}
        </div>
      ) : null}
      {aiFix || fixError ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded border border-line bg-white p-5 shadow-crisp">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-black text-ink">Fix it for me</h3>
              <button
                className="rounded border border-line px-3 py-1 text-sm font-semibold"
                onClick={() => {
                  setAiFix("");
                  setFixError("");
                }}
                type="button"
              >
                Close
              </button>
            </div>
            {fixError ? <p className="mt-4 rounded bg-red-50 p-3 text-sm font-semibold text-danger">{fixError}</p> : null}
            {aiFix ? <pre className="mt-4 whitespace-pre-wrap rounded bg-paper p-4 text-sm leading-6 text-gray-800">{aiFix}</pre> : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
