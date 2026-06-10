import { NextResponse } from "next/server";
import { getScan } from "@/lib/scans";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { hash: string } }) {
  const scan = await getScan(params.hash);
  if (!scan) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  return NextResponse.json(scan);
}
