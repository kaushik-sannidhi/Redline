"use client";

import { useEffect, useState } from "react";
import { getScoreBand, getScoreCopy } from "@/lib/score";

const bandClasses = {
  ready: "border-ready bg-ready text-white",
  caution: "border-caution bg-caution text-white",
  danger: "border-danger bg-danger text-white"
};

export function ScoreDisplay({ score, previousScore }: { score: number; previousScore?: number | null }) {
  const [displayScore, setDisplayScore] = useState(0);
  const band = getScoreBand(score);
  const copy = getScoreCopy(score);
  const delta = previousScore == null ? null : score - previousScore;

  useEffect(() => {
    const startedAt = performance.now();
    const duration = 700;
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / duration);
      setDisplayScore(Math.round(score * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <section className={`rounded border p-6 shadow-crisp ${bandClasses[band]}`}>
      <p className="text-sm font-bold uppercase tracking-[0.16em] opacity-90">Vibe Security Score</p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <p className="text-7xl font-black leading-none">{displayScore}</p>
        <p className="pb-2 text-2xl font-black">/100</p>
      </div>
      <h1 className="mt-5 text-3xl font-black">{copy.label}</h1>
      <p className="mt-2 max-w-2xl text-sm opacity-95">{copy.subtext}</p>
      {delta !== null ? (
        <p className="mt-4 inline-block rounded bg-white/15 px-3 py-1 text-sm font-semibold">
          {delta >= 0 ? "+" : ""}
          {delta} from previous scan
        </p>
      ) : null}
    </section>
  );
}
