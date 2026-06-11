import { NextResponse } from "next/server";
import { OAuthProvider } from "node-appwrite";
import { createAppwritePublicClient } from "@/lib/appwrite/server";
import { getBaseUrl, hasAppwriteSessionConfig } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request.url);

  if (!hasAppwriteSessionConfig()) {
    return NextResponse.redirect(`${baseUrl}/sign-in?auth=appwrite-not-configured`);
  }

  const appwrite = createAppwritePublicClient();
  if (!appwrite) {
    return NextResponse.redirect(`${baseUrl}/sign-in?auth=appwrite-not-configured`);
  }

  const redirectUrl = await appwrite.account.createOAuth2Token({
    provider: OAuthProvider.Github,
    success: `${baseUrl}/auth/callback`,
    failure: `${baseUrl}/sign-in?auth=github-failed`,
    scopes: ["read:user", "user:email", "repo"]
  });

  return NextResponse.redirect(redirectUrl);
}
