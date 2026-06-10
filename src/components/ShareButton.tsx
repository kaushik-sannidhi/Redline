"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export function ShareButton({ score }: { score: number }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    track("report_shared", { score });
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={copyLink} type="button">
      {copied ? "Link copied" : "Copy share link"}
    </button>
  );
}
