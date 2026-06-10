"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export function RescanButton({ hash, previousScore }: { hash: string; previousScore: number }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function rescan() {
    setIsLoading(true);
    track("rescan_initiated", { previous_score: previousScore });
    const response = await fetch("/api/rescan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash })
    });
    const data = (await response.json()) as { newHash?: string };
    if (data.newHash) router.push(`/scan/${data.newHash}/progress`);
    else setIsLoading(false);
  }

  return (
    <button
      className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink disabled:opacity-60"
      disabled={isLoading}
      onClick={() => void rescan()}
      type="button"
    >
      {isLoading ? "Starting..." : "Rescan"}
    </button>
  );
}
