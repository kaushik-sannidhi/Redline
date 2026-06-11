import { nanoid } from "nanoid";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
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
const localStorePath = path.join(process.cwd(), ".data", "scans.json");
let schemaReady: Promise<void> | null = null;

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

function isMissingResource(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("could not be found") || message.includes("not found");
}

function isAlreadyExists(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("already exists") || message.includes("already in use");
}

async function ignoreExisting(operation: Promise<unknown>) {
  try {
    await operation;
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }
}

async function ensureTable(appwrite: NonNullable<ReturnType<typeof createAppwriteAdminClient>>, databaseId: string, tableId: string, name: string) {
  try {
    await appwrite.tables.getTable({ databaseId, tableId });
  } catch (error) {
    if (!isMissingResource(error)) throw error;
    await appwrite.tables.createTable({ databaseId, tableId, name, enabled: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function ensureAppwriteSchema() {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) return;

  await ensureTable(appwrite, tableIds.databaseId, tableIds.scansTableId, "Scans");
  await ignoreExisting(appwrite.tables.createStringColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "hash", size: 64, required: true }));
  await ignoreExisting(appwrite.tables.createStringColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "url", size: 2048, required: true }));
  await ignoreExisting(appwrite.tables.createStringColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "repoUrl", size: 2048, required: false }));
  await ignoreExisting(appwrite.tables.createTextColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "stackJson", required: true }));
  await ignoreExisting(appwrite.tables.createIntegerColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "score", required: true, min: 0, max: 100 }));
  await ignoreExisting(appwrite.tables.createTextColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "findingsJson", required: true }));
  await ignoreExisting(appwrite.tables.createTextColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "summaryJson", required: true }));
  await ignoreExisting(appwrite.tables.createStringColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "userId", size: 64, required: false }));
  await ignoreExisting(appwrite.tables.createStringColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "status", size: 32, required: true }));
  await ignoreExisting(appwrite.tables.createStringColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "error", size: 2048, required: false }));
  await ignoreExisting(appwrite.tables.createIntegerColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "previousScore", required: false, min: 0, max: 100 }));
  await ignoreExisting(appwrite.tables.createDatetimeColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "createdAt", required: true }));
  await ignoreExisting(appwrite.tables.createDatetimeColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "completedAt", required: false }));
  await ignoreExisting(appwrite.tables.createBooleanColumn({ databaseId: tableIds.databaseId, tableId: tableIds.scansTableId, key: "isPublic", required: true }));

  await ensureTable(appwrite, tableIds.databaseId, tableIds.badgesTableId, "Badges");
  await ignoreExisting(appwrite.tables.createStringColumn({ databaseId: tableIds.databaseId, tableId: tableIds.badgesTableId, key: "scanHash", size: 64, required: true }));
  await ignoreExisting(appwrite.tables.createIntegerColumn({ databaseId: tableIds.databaseId, tableId: tableIds.badgesTableId, key: "lastScore", required: true, min: 0, max: 100 }));
  await ignoreExisting(appwrite.tables.createDatetimeColumn({ databaseId: tableIds.databaseId, tableId: tableIds.badgesTableId, key: "lastScannedAt", required: true }));

  await new Promise((resolve) => setTimeout(resolve, 1500));
}

async function ensureSchemaOnce() {
  schemaReady ??= ensureAppwriteSchema();
  return schemaReady;
}

export async function createScan(input: { url: string; repoUrl?: string | null; userId?: string | null; previousScore?: number | null }) {
  const scan = makeScan(input);
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();

  if (!appwrite || !tableIds) {
    await writeLocalScans([scan, ...(await readLocalScans())]);
    return scan;
  }
  try {
    await ensureSchemaOnce();

    const row = await appwrite.tables.createRow<ScanRow>({
      databaseId: tableIds.databaseId,
      tableId: tableIds.scansTableId,
      rowId: ID.unique(),
      data: scanToRowData(scan)
    });

    return rowToScan(row);
  } catch {
    await writeLocalScans([scan, ...(await readLocalScans())]);
    return scan;
  }
}

export async function getScan(hash: string): Promise<Scan | null> {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) return (await readLocalScans()).find((scan) => scan.hash === hash) ?? null;

  try {
    const rows = await appwrite.tables.listRows<ScanRow>({
      databaseId: tableIds.databaseId,
      tableId: tableIds.scansTableId,
      queries: [Query.equal("hash", hash), Query.limit(1)]
    });
    const row = rows.rows[0];
    return row ? rowToScan(row) : (await readLocalScans()).find((scan) => scan.hash === hash) ?? null;
  } catch {
    return (await readLocalScans()).find((scan) => scan.hash === hash) ?? null;
  }
}

export async function listScansForUser(userId: string): Promise<Scan[]> {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) {
    return (await readLocalScans())
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
    return (await readLocalScans())
      .filter((scan) => scan.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function listRecentScans(limit = 50): Promise<Scan[]> {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  if (!appwrite || !tableIds) {
    return (await readLocalScans()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }

  try {
    const rows = await appwrite.tables.listRows<ScanRow>({
      databaseId: tableIds.databaseId,
      tableId: tableIds.scansTableId,
      queries: [Query.orderDesc("$createdAt"), Query.limit(limit)]
    });
    return rows.rows.map(rowToScan);
  } catch {
    return (await readLocalScans()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}

async function readLocalScans(): Promise<Scan[]> {
  if (memoryScans.size) return Array.from(memoryScans.values());

  try {
    const raw = await readFile(localStorePath, "utf8");
    const scans = JSON.parse(raw) as Scan[];
    scans.forEach((scan) => memoryScans.set(scan.hash, scan));
    return scans;
  } catch {
    return [];
  }
}

async function writeLocalScans(scans: Scan[]) {
  memoryScans.clear();
  scans.forEach((scan) => memoryScans.set(scan.hash, scan));
  try {
    await mkdir(path.dirname(localStorePath), { recursive: true });
    await writeFile(localStorePath, JSON.stringify(scans, null, 2));
  } catch {
    // Memory keeps the current server process working if disk persistence is unavailable.
  }
}

export async function getScanStats(): Promise<{ scansRun: number; keysFound: number; appsSecured: number }> {
  const appwrite = createAppwriteAdminClient();
  const tableIds = getAppwriteTableIds();
  const summarize = (scans: Scan[]) => ({
    scansRun: scans.length,
    keysFound: scans.reduce(
      (count, scan) => count + scan.findings.filter((finding) => finding.category === "secret").length,
      0
    ),
    appsSecured: scans.filter((scan) => scan.status === "complete" && scan.score >= 70).length
  });

  if (!appwrite || !tableIds) return summarize(await readLocalScans());

  try {
    const rows = await appwrite.tables.listRows<ScanRow>({
      databaseId: tableIds.databaseId,
      tableId: tableIds.scansTableId,
      queries: [Query.orderDesc("$createdAt"), Query.limit(100)]
    });
    return summarize(rows.rows.map(rowToScan));
  } catch {
    return summarize(await readLocalScans());
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
    const scans = await readLocalScans();
    await writeLocalScans(scans.map((scan) => (scan.hash === hash ? updated : scan)));
    return updated;
  }

  try {
    const row = await appwrite.tables.updateRow<ScanRow>({
      databaseId: tableIds.databaseId,
      tableId: tableIds.scansTableId,
      rowId: existing.id,
      data: scanToRowData(updated)
    });

    return rowToScan(row);
  } catch {
    const scans = await readLocalScans();
    await writeLocalScans(scans.map((scan) => (scan.hash === hash ? updated : scan)));
    return updated;
  }
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

  try {
    await appwrite.tables.createRow({
      databaseId: tableIds.databaseId,
      tableId: tableIds.badgesTableId,
      rowId: ID.unique(),
      data
    });
  } catch {
    // Badge persistence should never block the scan/report flow.
  }
}
