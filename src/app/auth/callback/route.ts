import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAppwriteAdminClient, getAppwriteSessionCookieName } from "@/lib/appwrite/server";
import { getBaseUrl } from "@/lib/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const userId = requestUrl.searchParams.get("userId");
  const secret = requestUrl.searchParams.get("secret");
  const appwrite = createAppwriteAdminClient();

  if (userId && secret && appwrite) {
    const session = await appwrite.account.createSession({ userId, secret });
    cookies().set(getAppwriteSessionCookieName(), session.secret, {
      httpOnly: true,
      secure: requestUrl.protocol === "https:",
      sameSite: "lax",
      expires: new Date(session.expire),
      path: "/"
    });
  }

  return NextResponse.redirect(`${getBaseUrl(request.url)}/dashboard`);
}
