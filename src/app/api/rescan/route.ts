import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { createScan, getScan } from "@/lib/scans";
import { rescanRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = rescanRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid rescan request" }, { status: 400 });

  const previous = await getScan(parsed.data.hash);
  if (!previous) return NextResponse.json({ error: "Original scan not found" }, { status: 404 });
  const userId = await getAuthenticatedUserId();
  if (previous.userId && previous.userId !== userId) {
    return NextResponse.json({ error: "You do not own this scan" }, { status: 403 });
  }

  const next = await createScan({
    url: previous.url,
    repoUrl: previous.repoUrl,
    userId: previous.userId ?? userId,
    previousScore: previous.score
  });

  return NextResponse.json({ newHash: next.hash, previousScore: previous.score });
}
