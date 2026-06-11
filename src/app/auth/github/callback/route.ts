import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { getBaseUrl } from "@/lib/env";
import {
  applyAppwriteSessionCookie,
  ensureAppwriteSessionFromGitHub
} from "@/lib/github-session";
import {
  clearGitHubOAuthStateCookie,
  exchangeGitHubCode,
  getGitHubOAuthCallbackUrl,
  hasGitHubOAuthConfig,
  readGitHubOAuthStateCookie,
  setGitHubTokenCookie
} from "@/lib/github-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request.url);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/dashboard?auth=github-failed&reason=${encodeURIComponent(error)}`);
  }

  if (!hasGitHubOAuthConfig()) {
    return NextResponse.redirect(`${baseUrl}/dashboard?auth=github-not-configured`);
  }

  const expectedState = readGitHubOAuthStateCookie();
  clearGitHubOAuthStateCookie();

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${baseUrl}/dashboard?auth=github-failed&reason=invalid-state`);
  }

  try {
    const redirectUri = getGitHubOAuthCallbackUrl(request.url);
    const accessToken = await exchangeGitHubCode({ code, redirectUri });
    setGitHubTokenCookie(accessToken, request.url);

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      const { session } = await ensureAppwriteSessionFromGitHub(accessToken);
      applyAppwriteSessionCookie(session, request.url);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?auth=github-connected`);
  } catch (callbackError) {
    const reason =
      callbackError instanceof Error ? callbackError.message : "github-callback-failed";
    return NextResponse.redirect(`${baseUrl}/dashboard?auth=github-failed&reason=${encodeURIComponent(reason)}`);
  }
}
