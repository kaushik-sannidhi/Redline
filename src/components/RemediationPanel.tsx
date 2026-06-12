"use client";

import { useState } from "react";
import { DiffViewer } from "@/components/DiffViewer";
import type { Finding, RemediationPullRequest } from "@/lib/types";
import { track } from "@/lib/analytics";

export function RemediationPanel({
  hash,
  autoFixableFindings
}: {
  hash: string;
  autoFixableFindings: Finding[];
}) {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>(() => autoFixableFindings.map((_, index) => index));
  const [pullRequests, setPullRequests] = useState<RemediationPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startRemediation() {
    if (!selectedIndexes.length) {
      setError("Select at least one finding to fix.");
      return;
    }

    setIsLoading(true);
    setError("");
    track("remediation_started", { finding_count: selectedIndexes.length });

    try {
      const response = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, findingIndexes: selectedIndexes })
      });
      const data = (await response.json()) as { pullRequests?: RemediationPullRequest[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not remediate files");
      setPullRequests(data.pullRequests ?? []);
      track("remediation_completed", {
        pull_request_count: data.pullRequests?.filter((item) => item.pullRequestUrl).length ?? 0,
        finding_count: selectedIndexes.length,
        failed_count: data.pullRequests?.filter((item) => !item.pullRequestUrl).length ?? 0
      });
    } catch (remediationError) {
      const errorMessage = remediationError instanceof Error ? remediationError.message : "Could not create pull requests";
      setError(errorMessage);
      track("remediation_failed", { finding_count: selectedIndexes.length, error_message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  function toggleFinding(index: number) {
    setSelectedIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort((a, b) => a - b)
    );
  }

  if (!autoFixableFindings.length) return null;

  return (
    <section className="rounded border border-line bg-white p-5 shadow-crisp">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">Gemini code remediation</h2>
          <p className="mt-1 text-sm text-gray-600">
            Select findings and Redline will ask Gemini for focused code changes, then open one GitHub pull request per bug.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded border border-line px-4 py-2 text-sm font-semibold hover:border-ink"
            onClick={() => setSelectedIndexes(autoFixableFindings.map((_, index) => index))}
            type="button"
          >
            Select all
          </button>
          <button
            className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !selectedIndexes.length}
            onClick={startRemediation}
            type="button"
          >
            {isLoading ? "Opening PRs..." : `Fix ${selectedIndexes.length} selected`}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {autoFixableFindings.map((finding, index) => (
          <label className="flex items-start gap-3 rounded border border-line p-3" key={`${finding.id}-${index}`}>
            <input
              checked={selectedIndexes.includes(index)}
              className="mt-1"
              onChange={() => toggleFinding(index)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-black text-ink">{finding.title}</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{finding.severity}</span>
            </span>
          </label>
        ))}
      </div>

      {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

      {pullRequests.length ? (
        <div className="mt-5 space-y-4">
          {pullRequests.map((request) => (
            <article className="rounded border border-line bg-white p-4" key={`${request.finding.id}-${request.pullRequestUrl ?? request.error}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-ink">{request.finding.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{request.finding.fix}</p>
                </div>
                {request.pullRequestUrl ? (
                  <a
                    className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white"
                    href={request.pullRequestUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    PR #{request.pullRequestNumber}
                  </a>
                ) : null}
              </div>
              {request.error ? <p className="mt-3 rounded bg-red-50 p-3 text-sm font-semibold text-danger">{request.error}</p> : null}
              {request.results.length ? (
                <div className="mt-4 space-y-3">
                  {request.results.map((result) => (
                    <DiffViewer
                      changesSummary={result.changesSummary}
                      filePath={result.filePath}
                      fixed={result.fixed}
                      key={`${request.finding.id}-${result.filePath}`}
                      original={result.original}
                    />
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
