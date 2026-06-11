import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppwriteJwtCookieName, getAppwriteSessionCookieName } from "@/lib/appwrite/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { jwt?: string } | null;
  if (!body?.jwt) return NextResponse.json({ error: "JWT required" }, { status: 400 });

  const requestUrl = new URL(request.url);
  cookies().set(getAppwriteJwtCookieName(), body.jwt, {
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(getAppwriteJwtCookieName());
  cookies().delete(getAppwriteSessionCookieName());
  return NextResponse.json({ ok: true });
}
