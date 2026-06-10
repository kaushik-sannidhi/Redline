import { NextResponse } from "next/server";
import { getAuthenticatedUserId, getGithubProviderToken } from "@/lib/auth";
import { fetchGitHubPackageJson, fetchGitHubSourceSnapshot, parseGitHubRepoUrl } from "@/lib/github";
import { analyzeRepoCode } from "@/lib/scanner/code";
import { scanDependenciesFromPackageJson } from "@/lib/scanner/dependencies";
import { githubAnalyzeRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = githubAnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid repository URL" }, { status: 400 });
  if (!parseGitHubRepoUrl(parsed.data.repoUrl)) {
    return NextResponse.json({ error: "Only github.com repository URLs are supported" }, { status: 400 });
  }

  const providerToken = await getGithubProviderToken();

  const [sourceSnapshot, packageJson] = await Promise.all([
    fetchGitHubSourceSnapshot(parsed.data.repoUrl, providerToken),
    fetchGitHubPackageJson(parsed.data.repoUrl, providerToken)
  ]);

  const dependencyScan = packageJson
    ? scanDependenciesFromPackageJson(packageJson).catch(() => [])
    : Promise.resolve([]);
  const [codeFindings, dependencyFindings] = await Promise.all([analyzeRepoCode(sourceSnapshot), dependencyScan]);

  return NextResponse.json({ findings: [...codeFindings, ...dependencyFindings] });
}
