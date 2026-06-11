import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { env, getRequestOrigin } from "@/lib/env";

export const GITHUB_TOKEN_COOKIE = "redline_github_token";
export const GITHUB_OAUTH_STATE_COOKIE = "redline_github_oauth_state";

const GITHUB_SCOPES = ["read:user", "user:email", "repo"];

type GitHubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

export type GitHubOAuthUser = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
};

export function hasGitHubOAuthConfig(): boolean {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

export function getGitHubOAuthCallbackUrl(request: Request): string {
  return `${getRequestOrigin(request)}/auth/github/callback`;
}

export function createGitHubOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildGitHubAuthorizeUrl(input: { state: string; redirectUri: string }): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID!,
    redirect_uri: input.redirectUri,
    scope: GITHUB_SCOPES.join(" "),
    state: input.state,
    allow_signup: "true"
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(input: { code: string; redirectUri: string }): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: input.code,
      redirect_uri: input.redirectUri
    })
  });

  const data = (await response.json()) as GitHubTokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Could not exchange GitHub authorization code");
  }

  return data.access_token;
}

export async function fetchGitHubOAuthUser(accessToken: string): Promise<GitHubOAuthUser> {
  const response = await fetch("https://api.github.com/user", {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error("Could not read GitHub profile");
  }

  return (await response.json()) as GitHubOAuthUser;
}

export async function fetchGitHubPrimaryEmail(accessToken: string): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) return null;

  const emails = (await response.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
  const primary = emails.find((entry) => entry.primary && entry.verified) ?? emails.find((entry) => entry.verified);
  return primary?.email ?? emails[0]?.email ?? null;
}

export function getStoredGitHubToken(): string | null {
  return cookies().get(GITHUB_TOKEN_COOKIE)?.value ?? null;
}

export function setGitHubOAuthStateCookie(state: string, requestUrl: string) {
  const request = new URL(requestUrl);
  cookies().set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: request.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });
}

export function readGitHubOAuthStateCookie(): string | null {
  return cookies().get(GITHUB_OAUTH_STATE_COOKIE)?.value ?? null;
}

export function clearGitHubOAuthStateCookie() {
  cookies().delete(GITHUB_OAUTH_STATE_COOKIE);
}

export function setGitHubTokenCookie(accessToken: string, requestUrl: string) {
  const request = new URL(requestUrl);
  cookies().set(GITHUB_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: request.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearGitHubTokenCookie() {
  cookies().delete(GITHUB_TOKEN_COOKIE);
}
