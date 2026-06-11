"use client";

import { diffLines } from "diff";

export function DiffViewer({
  filePath,
  original,
  fixed,
  changesSummary
}: {
  filePath: string;
  original: string;
  fixed: string;
  changesSummary: string;
}) {
  const parts = diffLines(original, fixed);

  return (
    <article className="rounded border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-ink">{filePath}</h3>
          <p className="mt-1 text-sm text-gray-600">{changesSummary}</p>
        </div>
      </div>
      <pre className="mt-4 max-h-96 overflow-auto rounded bg-[#111827] p-4 text-xs leading-5 text-gray-100">
        {parts.map((part, index) => {
          const className = part.added ? "bg-green-950 text-green-100" : part.removed ? "bg-red-950 text-red-100" : "";
          const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
          return (
            <span className={`block whitespace-pre-wrap ${className}`} key={`${filePath}-${index}`}>
              {part.value
                .split("\n")
                .filter((line, lineIndex, lines) => line || lineIndex < lines.length - 1)
                .map((line) => `${prefix}${line}`)
                .join("\n")}
            </span>
          );
        })}
      </pre>
    </article>
  );
}
