import type { Finding, Scan, ScanProgressEvent } from "@/lib/types";
import { updateScan, upsertBadge } from "@/lib/scans";
import { analyzeHeaders } from "@/lib/scanner/headers";
import { crawlApp } from "@/lib/scanner/crawl";
import { scanScriptUrls } from "@/lib/scanner/secrets";
import { fetchGitHubPackageJson, fetchGitHubSourceSnapshot } from "@/lib/github";
import { analyzeRepoCode } from "@/lib/scanner/code";
import { scanDependenciesFromPackageJson } from "@/lib/scanner/dependencies";

type Emit = (event: ScanProgressEvent) => Promise<void> | void;

function uniqueFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.category}:${finding.id}:${finding.affected?.[0] ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function emitDone(emit: Emit, step: string, findings?: Finding[], message?: string) {
  await emit({ step, status: "done", findings, message });
}

export async function runScan(scan: Scan, emit: Emit): Promise<Scan> {
  let findings: Finding[] = [];
  let stack: string[] = [];

  try {
    await updateScan(scan.hash, { status: "running" });
    await emitDone(emit, "resolve", undefined, scan.url);

    await emit({ step: "headers", status: "running" });
    const headerResult = await analyzeHeaders(scan.url);
    findings = uniqueFindings([...findings, ...headerResult.findings]);
    let current = await updateScan(scan.hash, { findings, status: "running" });
    await emitDone(emit, "headers", headerResult.findings);

    await emit({ step: "crawl", status: "running" });
    const crawlResult = await crawlApp(scan.url, headerResult.headers);
    stack = crawlResult.stack;
    findings = uniqueFindings([...findings, ...crawlResult.findings]);
    current = await updateScan(scan.hash, { findings, stack, status: "running" });
    await emitDone(emit, "crawl", crawlResult.findings);

    await emit({ step: "js", status: "running" });
    const scriptFindings = await scanScriptUrls(crawlResult.scriptUrls);
    findings = uniqueFindings([...findings, ...scriptFindings]);
    current = await updateScan(scan.hash, { findings, stack, status: "running" });
    await emitDone(emit, "js", scriptFindings);

    if (scan.repoUrl) {
      await emit({ step: "code", status: "running" });
      const sourceSnapshot = await fetchGitHubSourceSnapshot(scan.repoUrl);
      const codeFindings = await analyzeRepoCode(sourceSnapshot);
      findings = uniqueFindings([...findings, ...codeFindings]);
      current = await updateScan(scan.hash, { findings, stack, status: "running" });
      await emitDone(emit, "code", codeFindings);

      await emit({ step: "deps", status: "running" });
      const packageJson = await fetchGitHubPackageJson(scan.repoUrl);
      const depFindings = packageJson ? await scanDependenciesFromPackageJson(packageJson).catch(() => []) : [];
      findings = uniqueFindings([...findings, ...depFindings]);
      current = await updateScan(scan.hash, { findings, stack, status: "running" });
      await emitDone(emit, "deps", depFindings);
    } else {
      await emitDone(emit, "code");
      await emitDone(emit, "deps");
    }

    await emitDone(emit, "storage");
    await emitDone(emit, "forms");
    await emitDone(emit, "score");

    current = await updateScan(scan.hash, {
      findings,
      stack,
      status: "complete",
      completedAt: new Date().toISOString()
    });
    await upsertBadge(current);
    await emit({ step: "done", status: "done", scan: current });
    return current;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    const failed = await updateScan(scan.hash, { status: "error", error: message, completedAt: new Date().toISOString() });
    await emit({ step: "done", status: "error", message, scan: failed });
    return failed;
  }
}
