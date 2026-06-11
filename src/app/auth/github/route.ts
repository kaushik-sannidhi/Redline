import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/env";
import {
  buildGitHubAuthorizeUrl,
  createGitHubOAuthState,
  getGitHubOAuthCallbackUrl,
  hasGitHubOAuthConfig,
  setGitHubOAuthStateCookie
} from "@/lib/github-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request.url);

  if (!hasGitHubOAuthConfig()) {
    return NextResponse.redirect(`${baseUrl}/dashboard?auth=github-not-configured`);
  }

  const state = createGitHubOAuthState();
  setGitHubOAuthStateCookie(state, request.url);

  const redirectUri = getGitHubOAuthCallbackUrl(request.url);
  const authorizeUrl = buildGitHubAuthorizeUrl({ state, redirectUri });

  return NextResponse.redirect(authorizeUrl);
}
