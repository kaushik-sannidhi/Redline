import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { createScan } from "@/lib/scans";
import { scanRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = scanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid scan request" }, { status: 400 });
  }

  const scan = await createScan({
    url: parsed.data.url,
    repoUrl: parsed.data.repoUrl || null,
    userId: await getAuthenticatedUserId()
  });

  return NextResponse.json({ scanHash: scan.hash });
}
