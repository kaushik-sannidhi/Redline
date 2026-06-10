"use client";

import { useMemo, useState } from "react";
import { track } from "@/lib/analytics";

export function EmbedBadge({ hash, score }: { hash: string; score: number }) {
  const [copied, setCopied] = useState(false);
  const snippet = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `<img src="${window.location.origin}/api/badge/${hash}" alt="Redline security score" />`;
  }, [hash]);

  if (score < 70) return null;

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    track("badge_generated", { score });
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded border border-line bg-white p-5 shadow-crisp">
      <h2 className="text-xl font-black text-ink">Embed badge</h2>
      <img className="mt-4" src={`/api/badge/${hash}`} alt="Redline score badge" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <code className="flex-1 overflow-x-auto rounded bg-paper p-3 text-xs text-gray-700">{snippet}</code>
        <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={copySnippet} type="button">
          {copied ? "Copied" : "Copy HTML"}
        </button>
      </div>
    </section>
  );
}
