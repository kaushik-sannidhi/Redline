import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDevAuthCookieName } from "@/lib/auth";

export const runtime = "nodejs";

function encodeUser(email: string, mode: "sign-in" | "sign-up") {
  const normalized = email.trim().toLowerCase();
  return Buffer.from(
    JSON.stringify({
      $id: `local_${normalized.replace(/[^a-z0-9]/g, "_")}`,
      email: normalized,
      name: normalized.split("@")[0],
      mode
    }),
    "utf8"
  ).toString("base64url");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; mode?: "sign-in" | "sign-up" } | null;
  const email = body?.email?.trim();
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Use a valid email address." }, { status: 400 });

  cookies().set(getDevAuthCookieName(), encodeUser(email, body?.mode ?? "sign-in"), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(getDevAuthCookieName());
  return NextResponse.json({ ok: true });
}
