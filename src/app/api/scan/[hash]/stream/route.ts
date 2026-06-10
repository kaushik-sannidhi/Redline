import { getScan } from "@/lib/scans";
import { runScan } from "@/lib/scanner/run-scan";
import type { ScanProgressEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encode(event: ScanProgressEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(_: Request, { params }: { params: { hash: string } }) {
  const scan = await getScan(params.hash);
  if (!scan) {
    return new Response(encode({ step: "done", status: "error", message: "Scan not found" }), {
      status: 404,
      headers: { "Content-Type": "text/event-stream" }
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ScanProgressEvent) => controller.enqueue(new TextEncoder().encode(encode(event)));

      if (scan.status === "complete" || scan.status === "error") {
        send({ step: "done", status: scan.status === "complete" ? "done" : "error", scan, message: scan.error ?? undefined });
        controller.close();
        return;
      }

      await runScan(scan, send);
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
