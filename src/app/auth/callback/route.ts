import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAppwriteAdminClient, getAppwriteSessionCookieName } from "@/lib/appwrite/server";
import { getBaseUrl } from "@/lib/env";
import { setGitHubTokenCookie } from "@/lib/github-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = getBaseUrl(request.url);
  const userId = requestUrl.searchParams.get("userId");
  const secret = requestUrl.searchParams.get("secret");
  const appwrite = createAppwriteAdminClient();

  if (!userId || !secret || !appwrite) {
    return NextResponse.redirect(`${baseUrl}/sign-in?auth=github-failed&reason=missing-session`);
  }

  try {
    const session = await appwrite.account.createSession({ userId, secret });
    cookies().set(getAppwriteSessionCookieName(), session.secret, {
      httpOnly: true,
      secure: requestUrl.protocol === "https:",
      sameSite: "lax",
      expires: new Date(session.expire),
      path: "/"
    });

    if (session.provider === "github" && session.providerAccessToken) {
      setGitHubTokenCookie(session.providerAccessToken, request.url);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?auth=github-signed-in`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "session-create-failed";
    return NextResponse.redirect(`${baseUrl}/sign-in?auth=github-failed&reason=${encodeURIComponent(reason)}`);
  }
}
