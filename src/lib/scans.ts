import { nanoid } from "nanoid";
import { ID, Query, type Models } from "node-appwrite";
import type { Finding, Scan, ScanStatus } from "@/lib/types";
import { calculateScore, summarizeFindings } from "@/lib/score";
import { createAppwriteAdminClient, getAppwriteTableIds } from "@/lib/appwrite/server";

type ScanRow = Models.Row & {
  hash: string;
  url: string;
  repoUrl?: string | null;
  stackJson?: string | null;
  score: number;
  findingsJson?: string | null;
  summaryJson?: string | null;
  userId?: string | null;
  status: ScanStatus;
  error?: string | null;
  previousScore?: number | null;
  createdAt?: string | null;
  completedAt?: string | null;
};

const memoryScans = new Map<string, Scan>();

function now() {
  return new Date().toISOString();
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToScan(row: ScanRow): Scan {
  const findings = parseJson<Finding[]>(row.findingsJson, []);
  return {
    id: row.$id,
    hash: row.hash,
    url: row.url,
    repoUrl: row.repoUrl ?? null,
    stack: parseJson<string[]>(row.stackJson, []),
    score: row.score,
    findings,
    summary: parseJson<Scan["summary"]>(row.summaryJson, summarizeFindings(findings)),
    userId: row.userId ?? null,
    status: row.status ?? "pending",
    error: row.error ?? null,
    previousScore: row.previousScore ?? null,
    createdAt: row.createdAt ?? row.$createdAt,
    completedAt: row.completedAt ?? null
  };
}

function scanToRowData(scan: Scan) {
  return {
    hash: scan.hash,
    url: scan.url,
    repoUrl: scan.repoUrl ?? null,
    stackJson: JSON.stringify(scan.stack),
    score: scan.score,
    findingsJson: JSON.stringify(scan.findings),
    summaryJson: JSON.stringify(scan.summary),
    userId: scan.userId ?? null,
    status: scan.status,
    error: scan.error ?? null,
    previousScore: scan.previousScore ?? null,
    createdAt: scan.createdAt,
    completedAt: scan.completedAt ?? null,
    isPublic: true
  };
}

function makeScan(input: { url: string; repoUrl?: string | null; userId?: string | null; previousScore?: number | null }): Scan {
  return {
    id: crypto.randomUUID(),
    hash: nanoid(10),
    url: input.url,
    repoUrl: input.repoUrl || null,
    stack: [],
    score: 100,
    findings: [],
    summary: summarizeFindings([]),
    userId: input.userId || null,
    status: "pending",
    error: null,
    previousScore: input.previousScore ?? null,
    createdAt: now(),
    completedAt: null
  };
}

export async function createScan(input: { url: string; repoUrl?: string | null; userId?: string | null; previousScore?: number | null }) {
  const scan = makeScan(input);
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();

  if (!appwrite || !tableIds) {
    memoryScans.set(scan.hash, scan);
    return scan;
  }

  const row = await appwrite.tables.createRow<ScanRow>({
    databaseId: tableIds.databaseId,
    tableId: tableIds.scansTableId,
    rowId: ID.unique(),
    data: scanToRowData(scan)
  });

  return rowToScan(row);
}

export async function getScan(hash: string): Promise<Scan | null> {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) return memoryScans.get(hash) ?? null;

  try {
    const rows = await appwrite.tables.listRows<ScanRow>({
      databaseId: tableIds.databaseId,
      tableId: tableIds.scansTableId,
      queries: [Query.equal("hash", hash), Query.limit(1)]
    });
    const row = rows.rows[0];
    return row ? rowToScan(row) : null;
  } catch {
    return null;
  }
}

export async function listScansForUser(userId: string): Promise<Scan[]> {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) {
    return Array.from(memoryScans.values())
      .filter((scan) => scan.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  try {
    const rows = await appwrite.tables.listRows<ScanRow>({
      databaseId: tableIds.databaseId,
      tableId: tableIds.scansTableId,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(50)]
    });
    return rows.rows.map(rowToScan);
  } catch {
    return [];
  }
}

export async function updateScan(
  hash: string,
  patch: Partial<Pick<Scan, "findings" | "stack" | "status" | "error" | "completedAt">>
) {
  const existing = await getScan(hash);
  if (!existing) throw new Error("Scan not found");

  const findings = patch.findings ?? existing.findings;
  const updated: Scan = {
    ...existing,
    ...patch,
    findings,
    score: calculateScore(findings),
    summary: summarizeFindings(findings)
  };

  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) {
    memoryScans.set(hash, updated);
    return updated;
  }

  const row = await appwrite.tables.updateRow<ScanRow>({
    databaseId: tableIds.databaseId,
    tableId: tableIds.scansTableId,
    rowId: existing.id,
    data: scanToRowData(updated)
  });

  return rowToScan(row);
}

export async function upsertBadge(scan: Scan) {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) return;

  const data = {
    scanHash: scan.hash,
    lastScore: scan.score,
    lastScannedAt: scan.completedAt ?? now()
  };

  try {
    const existing = await appwrite.tables.listRows({
      databaseId: tableIds.databaseId,
      tableId: tableIds.badgesTableId,
      queries: [Query.equal("scanHash", scan.hash), Query.limit(1)]
    });
    const row = existing.rows[0];
    if (row) {
      await appwrite.tables.updateRow({
        databaseId: tableIds.databaseId,
        tableId: tableIds.badgesTableId,
        rowId: row.$id,
        data
      });
      return;
    }
  } catch {
    // A badge is a cache of scan state; failures should not break scan completion.
  }

  await appwrite.tables.createRow({
    databaseId: tableIds.databaseId,
    tableId: tableIds.badgesTableId,
    rowId: ID.unique(),
    data
  });
}
