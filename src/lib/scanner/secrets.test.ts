import { describe, expect, it } from "vitest";
import { scanTextForSecrets } from "@/lib/scanner/secrets";

describe("scanTextForSecrets", () => {
  it("finds common client-side secrets", () => {
    const openaiKey = "sk-" + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const stripeKey = "sk_" + "live_" + "abcdefghijklmnopqrstuvwxyz123456";
    const githubToken = "ghp_" + "abcdefghijklmnopqrstuvwxyz1234567890";
    const firebaseKey = "AI" + "zaabcdefghijklmnopqrstuvwxyzabcdefghi";
    const code = `
      const openai = "${openaiKey}";
      const stripe = "${stripeKey}";
      const github = "${githubToken}";
      const firebase = "${firebaseKey}";
      const api_key = "hardcodedtoken1234567890";
    `;

    const findings = scanTextForSecrets(code, "bundle.js");
    expect(findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining(["openai-key", "stripe-live", "github-token", "firebase-key", "generic-secret"])
    );
  });

  it("truncates evidence", () => {
    const findings = scanTextForSecrets("const key = '" + "sk-" + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL1234567890'", "bundle.js");
    expect(findings[0]?.evidence).toMatch(/\.\.\.$/);
  });
});
