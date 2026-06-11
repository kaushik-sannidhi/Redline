"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectGitHubButton } from "@/components/ConnectGitHubButton";
import { track } from "@/lib/analytics";
import type { GitHubRepository } from "@/lib/github";

type RepositoriesResponse = {
  repositories?: GitHubRepository[];
  error?: string;
};

export function UrlScanForm({ defaultUrl }: { defaultUrl: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(defaultUrl);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoQuery, setRepoQuery] = useState("");
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [repoError, setRepoError] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [needsGitHubConnection, setNeedsGitHubConnection] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadRepositories() {
      setIsLoadingRepos(true);
      setRepoError("");
      try {
        const response = await fetch("/api/github/repos", { cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as RepositoriesResponse;
        if (!isActive) return;

        if (!response.ok) {
          setNeedsGitHubConnection(response.status === 401 || response.status === 403);
          setRepoError(data.error ?? "Connect GitHub to list repositories");
          return;
        }

        setRepositories(data.repositories ?? []);
        setNeedsGitHubConnection(false);
      } catch {
        if (isActive) setRepoError("Could not load GitHub repositories");
      } finally {
        if (isActive) setIsLoadingRepos(false);
      }
    }

    void loadRepositories();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredRepositories = useMemo(() => {
    const query = repoQuery.trim().toLowerCase();
    if (!query) return repositories;
    return repositories.filter((repo) => repo.fullName.toLowerCase().includes(query));
  }, [repoQuery, repositories]);

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
          className="min-h-12 rounded border border-line bg-white px-4 text-base text-ink outline-none placeholder:text-gray-400 focus:border-ink"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://your-app.vercel.app"
          type="url"
          required
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="min-h-12 rounded bg-ink px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting..." : "Scan ->"}
          </button>
        </div>
      </div>
      <div className="mt-3 rounded border border-line bg-white p-3 shadow-crisp">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-ink">GitHub repository</p>
            <p className="mt-1 text-xs text-gray-500">Optional. Connected repos enable code analysis and Gemini pull requests.</p>
          </div>
          {needsGitHubConnection ? <ConnectGitHubButton label="Connect GitHub account" /> : null}
        </div>

        {isLoadingRepos ? <p className="mt-3 text-sm text-gray-600">Loading repositories...</p> : null}

        {!isLoadingRepos && repositories.length ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
            <label className="sr-only" htmlFor="repo-search">
              Search repositories
            </label>
            <input
              id="repo-search"
              className="min-h-11 rounded border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-gray-400 focus:border-ink"
              value={repoQuery}
              onChange={(event) => setRepoQuery(event.target.value)}
              placeholder={`Search ${repositories.length} repositories`}
              type="search"
            />
            <label className="sr-only" htmlFor="repo-picker">
              Choose repository
            </label>
            <select
              id="repo-picker"
              className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-ink"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
            >
              <option value="">Do not attach a repo</option>
              {filteredRepositories.map((repo) => (
                <option key={repo.id} value={repo.htmlUrl}>
                  {repo.fullName}
                  {repo.private ? " private" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!isLoadingRepos && !repositories.length && !needsGitHubConnection ? (
          <p className="mt-3 text-sm text-gray-600">No repositories were returned for this GitHub account.</p>
        ) : null}

        {repoError ? <p className="mt-3 text-sm font-medium text-gray-600">{repoError}</p> : null}

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-gray-500">Use a repository URL instead</summary>
          <label className="sr-only" htmlFor="repo-url">
            GitHub repository URL
          </label>
          <input
            id="repo-url"
            className="mt-3 min-h-11 w-full rounded border border-line bg-white px-3 text-sm text-ink outline-none placeholder:text-gray-400 focus:border-ink"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/org/repo"
            type="url"
          />
        </details>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
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
