import type { Finding, FindingSeverity, ScoreBand, ScanSummary } from "./types";

export const DEDUCTIONS: Record<FindingSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 7,
  low: 3
};

export function calculateScore(findings: Finding[]): number {
  const score = findings.reduce((current, finding) => current - DEDUCTIONS[finding.severity], 100);
  return Math.max(0, score);
}

export function summarizeFindings(findings: Finding[]): ScanSummary {
  return findings.reduce<ScanSummary>(
    (summary, finding) => {
      summary[finding.severity] += 1;
      summary.total += 1;
      return summary;
    },
    { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  );
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return "ready";
  if (score >= 50) return "caution";
  return "danger";
}

export function getScoreCopy(score: number): { label: string; subtext: string } {
  const band = getScoreBand(score);
  if (band === "ready") {
    return {
      label: "Ready to ship",
      subtext: "No critical issues found. Review remaining findings before launch."
    };
  }
  if (band === "caution") {
    return {
      label: "Fix before sharing",
      subtext: "You have issues that could expose user data or your API keys."
    };
  }
  return {
    label: "Not ready",
    subtext: "Critical vulnerabilities found. Do not share this URL publicly."
  };
}
