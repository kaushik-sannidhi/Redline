import { getScan } from "@/lib/scans";
import { getScoreBand } from "@/lib/score";

export const runtime = "nodejs";

const COLORS = {
  ready: "#168a4a",
  caution: "#c77900",
  danger: "#c2410c"
};

export async function GET(_: Request, { params }: { params: { hash: string } }) {
  const scan = await getScan(params.hash);
  if (!scan) return new Response("Not found", { status: 404 });

  const band = getScoreBand(scan.score);
  const color = COLORS[band];
  const label = band === "ready" ? "Ready" : band === "caution" ? "Review" : "Not ready";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="238" height="48" role="img" aria-label="Redline score ${scan.score}/100">
  <rect width="238" height="48" rx="6" fill="#111827"/>
  <rect x="0" y="0" width="86" height="48" rx="6" fill="${color}"/>
  <text x="16" y="29" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#fff">Redline</text>
  <text x="102" y="21" font-family="Arial, sans-serif" font-size="13" fill="#fff">${label}</text>
  <text x="102" y="37" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">Score: ${scan.score}/100</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60"
    }
  });
}
