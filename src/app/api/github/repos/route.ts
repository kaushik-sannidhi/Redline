import { NextResponse } from "next/server";
import { getAuthenticatedUserId, getGithubProviderToken } from "@/lib/auth";
import { listGitHubRepositories } from "@/lib/github";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const token = await getGithubProviderToken();
  if (!token) return NextResponse.json({ error: "Connect GitHub to list repositories" }, { status: 403 });

  try {
    const repositories = await listGitHubRepositories(token);
    return NextResponse.json({ repositories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not list GitHub repositories" },
      { status: 502 }
    );
  }
}
