export type FindingCategory = "header" | "secret" | "crawl" | "code" | "dependency";
export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type ScanStatus = "pending" | "running" | "complete" | "error";

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  what: string;
  why: string;
  fix: string;
  evidence?: string;
  affected?: string[];
}

export interface ScanSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface Scan {
  id: string;
  hash: string;
  url: string;
  repoUrl?: string | null;
  stack: string[];
  score: number;
  findings: Finding[];
  summary: ScanSummary;
  userId?: string | null;
  status: ScanStatus;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
  previousScore?: number | null;
}

export type ScoreBand = "ready" | "caution" | "danger";

export interface ScanProgressEvent {
  step: string;
  status: "running" | "done" | "error";
  findings?: Finding[];
  message?: string;
  scan?: Scan;
}

export interface ScanStep {
  id: string;
  label: string;
  optional?: boolean;
}
