"use client";

import { track } from "@/lib/analytics";

export function DownloadPdfButton({ score, totalFindings }: { score: number; totalFindings: number }) {
  function handleDownload() {
    track("report_pdf_downloaded", { score, total_findings: totalFindings });
    window.print();
  }

  return (
    <button className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink" onClick={handleDownload} type="button">
      Download PDF
    </button>
  );
}
