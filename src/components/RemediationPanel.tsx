"use client";

import { useState } from "react";
import JSZip from "jszip";
import { DiffViewer } from "@/components/DiffViewer";
import type { Finding, RemediationResult } from "@/lib/types";
import { track } from "@/lib/analytics";

export function RemediationPanel({
  hash,
  autoFixableFindings
}: {
  hash: string;
  autoFixableFindings: Finding[];
}) {
  const [results, setResults] = useState<RemediationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startRemediation() {
    setIsLoading(true);
    setError("");
    track("remediation_started", { file_count: autoFixableFindings.length });

    try {
      const response = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash })
      });
      const data = (await response.json()) as { results?: RemediationResult[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not remediate files");
      setResults(data.results ?? []);
      track("remediation_completed", { file_count: data.results?.length ?? 0 });
    } catch (remediationError) {
      setError(remediationError instanceof Error ? remediationError.message : "Could not remediate files");
    } finally {
      setIsLoading(false);
    }
  }

  async function downloadFixedFiles() {
    const zip = new JSZip();
    results.forEach((result) => zip.file(result.filePath, result.fixed));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `redline-fixed-${hash}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!autoFixableFindings.length) return null;

  return (
    <section className="rounded border border-line bg-white p-5 shadow-crisp">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">Gemini code remediation</h2>
          <p className="mt-1 text-sm text-gray-600">
            {autoFixableFindings.length} finding{autoFixableFindings.length === 1 ? "" : "s"} can be rewritten or packaged as a fix plan.
          </p>
        </div>
        <button
          className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={startRemediation}
          type="button"
        >
          {isLoading ? "Gemini is rewriting..." : `Fix ${autoFixableFindings.length} with Gemini`}
        </button>
      </div>

      {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      {results.length ? (
        <div className="mt-5 space-y-4">
          <button className="rounded border border-line px-4 py-2 text-sm font-semibold hover:border-ink" onClick={downloadFixedFiles} type="button">
            Download fixed files
          </button>
          {results.map((result) => (
            <DiffViewer
              changesSummary={result.changesSummary}
              filePath={result.filePath}
              fixed={result.fixed}
              key={result.filePath}
              original={result.original}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
