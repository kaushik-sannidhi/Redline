import { describe, expect, it, vi } from "vitest";
import { analyzeHeaders } from "@/lib/scanner/headers";

describe("analyzeHeaders", () => {
  it("flags missing security headers and open cross-site rules", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } }))
    );

    const result = await analyzeHeaders("https://example.com");
    expect(result.findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining(["open-cors", "missing-csp", "missing-hsts", "missing-x-frame", "missing-xcto", "missing-referrer"])
    );

    vi.unstubAllGlobals();
  });
});
