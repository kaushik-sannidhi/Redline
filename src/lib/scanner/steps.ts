import type { ScanStep } from "@/lib/types";

export const SCAN_STEPS: ScanStep[] = [
  { id: "resolve", label: "Resolving URL" },
  { id: "headers", label: "Checking security headers" },
  { id: "crawl", label: "Crawling pages" },
  { id: "js", label: "Scanning JavaScript bundles" },
  { id: "storage", label: "Checking browser storage" },
  { id: "forms", label: "Analyzing forms" },
  { id: "code", label: "Analyzing repository code", optional: true },
  { id: "deps", label: "Checking dependencies", optional: true },
  { id: "score", label: "Calculating Vibe Security Score" },
  { id: "done", label: "Report ready" }
];
