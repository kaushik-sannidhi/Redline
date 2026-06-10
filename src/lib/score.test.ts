import { describe, expect, it } from "vitest";
import { calculateScore, getScoreBand, summarizeFindings } from "@/lib/score";
import type { Finding } from "@/lib/types";

function finding(severity: Finding["severity"]): Finding {
  return {
    id: severity,
    category: "header",
    severity,
    title: severity,
    what: "what",
    why: "why",
    fix: "fix"
  };
}

describe("score", () => {
  it("deducts by severity and floors at zero", () => {
    expect(calculateScore([finding("critical"), finding("high"), finding("medium"), finding("low")])).toBe(50);
    expect(calculateScore(Array.from({ length: 8 }, () => finding("critical")))).toBe(0);
  });

  it("summarizes findings", () => {
    expect(summarizeFindings([finding("high"), finding("high"), finding("low")])).toEqual({
      critical: 0,
      high: 2,
      medium: 0,
      low: 1,
      total: 3
    });
  });

  it("maps score bands", () => {
    expect(getScoreBand(90)).toBe("ready");
    expect(getScoreBand(70)).toBe("caution");
    expect(getScoreBand(40)).toBe("danger");
  });
});
