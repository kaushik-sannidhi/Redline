"use client";

export function DownloadPdfButton() {
  return (
    <button className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink" onClick={() => window.print()} type="button">
      Download PDF
    </button>
  );
}
