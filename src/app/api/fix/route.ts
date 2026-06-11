import { NextResponse } from "next/server";
import type { Finding } from "@/lib/types";
import { explainFindingFix } from "@/lib/scanner/remediation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { finding?: Finding; stack?: string[] } | null;
  if (!body?.finding) return NextResponse.json({ error: "Finding required" }, { status: 400 });

  const fix = await explainFindingFix(body.finding, body.stack ?? []);
  return NextResponse.json({ fix });
}
