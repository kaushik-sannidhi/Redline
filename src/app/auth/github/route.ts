import { NextResponse } from "next/server";
import { OAuthProvider } from "node-appwrite";
import { createAppwriteAdminClient } from "@/lib/appwrite/server";
import { getBaseUrl } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const appwrite = createAppwriteAdminClient();
  if (!appwrite) {
    return NextResponse.redirect(`${getBaseUrl(request.url)}/dashboard?auth=appwrite-not-configured`);
  }

  const baseUrl = getBaseUrl(request.url);
  const redirectUrl = await appwrite.account.createOAuth2Token({
    provider: OAuthProvider.Github,
    success: `${baseUrl}/auth/callback`,
    failure: `${baseUrl}/dashboard?auth=github-failed`,
    scopes: ["read:user", "user:email", "repo"]
  });

  return NextResponse.redirect(redirectUrl);
}
