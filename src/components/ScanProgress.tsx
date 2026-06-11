"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SCAN_STEPS } from "@/lib/scanner/steps";
import type { ScanProgressEvent } from "@/lib/types";
import { track } from "@/lib/analytics";

type StepState = "waiting" | "running" | "done" | "error";

export function ScanProgress({ hash }: { hash: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<Record<string, StepState>>({});
  const [findingCounts, setFindingCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");

  const visibleSteps = useMemo(() => SCAN_STEPS.filter((step) => !step.optional || events[step.id]), [events]);

  useEffect(() => {
    const source = new EventSource(`/api/scan/${hash}/stream`);
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as ScanProgressEvent;
      setEvents((current) => ({ ...current, [payload.step]: payload.status === "done" ? "done" : payload.status }));
      if (payload.findings?.length) {
        setFindingCounts((current) => ({ ...current, [payload.step]: payload.findings?.length ?? 0 }));
      }
      if (payload.message) setMessage(payload.message);
      if (payload.step === "done" && payload.status === "done" && payload.scan) {
        track("scan_completed", {
          score: payload.scan.score,
          critical_count: payload.scan.summary.critical,
          high_count: payload.scan.summary.high,
          stack: payload.scan.stack
        });
        source.close();
        setTimeout(() => router.push(`/report/${hash}`), 600);
      }
      if (payload.status === "error") source.close();
    };
    source.onerror = () => {
      setEvents((current) => ({ ...current, done: "error" }));
      setMessage("The scan stream disconnected. Refresh to recover the latest report state.");
      source.close();
    };
    return () => source.close();
  }, [hash, router]);

  return (
    <div className="rounded border border-line bg-white p-5 shadow-crisp">
      <ol className="space-y-3">
        {visibleSteps.map((step) => {
          const state = events[step.id] ?? "waiting";
          return (
            <li className="flex items-center gap-3" key={step.id}>
              <span
                className={[
                  "h-3 w-3 rounded-full",
                  state === "done" ? "bg-ready" : state === "running" ? "bg-caution" : state === "error" ? "bg-danger" : "bg-gray-300"
                ].join(" ")}
              />
              <span className="flex-1 text-sm font-medium text-gray-800">{step.label}</span>
              {findingCounts[step.id] ? (
                <span className="text-xs font-semibold text-danger">
                  {findingCounts[step.id]} issue{findingCounts[step.id] === 1 ? "" : "s"}
                </span>
              ) : null}
              <span className="text-xs uppercase tracking-wide text-gray-500">{state}</span>
            </li>
          );
        })}
      </ol>
      {message ? <p className="mt-5 rounded bg-paper p-3 text-sm text-gray-700">{message}</p> : null}
    </div>
  );
}
