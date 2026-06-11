import { NextResponse } from "next/server";
import { getGithubProviderToken } from "@/lib/auth";
import { fetchGitHubSourceFiles } from "@/lib/github";
import { getScan } from "@/lib/scans";
import { remediateFiles } from "@/lib/scanner/remediation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { hash?: string } | null;
  if (!body?.hash) return NextResponse.json({ error: "Scan hash required" }, { status: 400 });

  const scan = await getScan(body.hash);
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  if (!scan.repoUrl) return NextResponse.json({ error: "Connect a GitHub repo before remediation" }, { status: 400 });

  const token = await getGithubProviderToken();
  const files = await fetchGitHubSourceFiles(scan.repoUrl, token);
  const results = await remediateFiles(files, scan.findings, scan.stack);

  return NextResponse.json({ results });
}
