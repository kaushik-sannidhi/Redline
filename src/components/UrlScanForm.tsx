"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export function UrlScanForm({ defaultUrl }: { defaultUrl: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(defaultUrl);
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startScan(targetUrl: string, targetRepoUrl = "") {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, repoUrl: targetRepoUrl })
      });
      const data = (await response.json()) as { scanHash?: string; error?: string };
      if (!response.ok || !data.scanHash) throw new Error(data.error ?? "Could not start scan");
      track("scan_initiated", {
        url_domain: new URL(targetUrl).hostname,
        is_authenticated: false,
        has_repo: Boolean(targetRepoUrl)
      });
      router.push(`/scan/${data.scanHash}/progress`);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Could not start scan");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        void startScan(url, repoUrl);
      }}
    >
      <div className="grid gap-3 rounded border border-line bg-white p-2 shadow-crisp">
        <label className="sr-only" htmlFor="scan-url">
          App URL
        </label>
        <input
          id="scan-url"
          className="min-h-12 rounded border border-transparent px-4 text-base outline-none focus:border-ink"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://your-app.vercel.app"
          type="url"
          required
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="repo-url">
            GitHub repository URL
          </label>
          <input
            id="repo-url"
            className="min-h-12 flex-1 rounded border border-line px-4 text-base outline-none focus:border-ink"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="Optional GitHub repo URL for code fixes"
            type="url"
          />
          <button
            className="min-h-12 rounded bg-ink px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting..." : "Scan ->"}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink"
          type="button"
          onClick={() => void startScan(defaultUrl)}
          disabled={isSubmitting}
        >
          Scan demo app
        </button>
        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      </div>
    </form>
  );
}
