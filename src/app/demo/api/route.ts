import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function GET() {
  return NextResponse.json({ ok: true, demo: "open cors" }, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST() {
  return NextResponse.json(
    { ok: true },
    {
      headers: corsHeaders
    }
  );
}
