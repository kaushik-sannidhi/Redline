import type { Finding } from "@/lib/types";
import { env } from "@/lib/env";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function makePrompt(repoContents: string) {
  return `You are a security engineer reviewing code from an AI-generated web app.
Analyze this code for ONLY these vulnerability classes:
1. Hardcoded secrets or API keys in source files
2. eval() or Function() with dynamic strings
3. dangerouslySetInnerHTML or innerHTML with unsanitized user input
4. Direct SQL string concatenation
5. Secret-looking environment variables used in client-side code
6. .env or config files committed to the repo

Return ONLY a JSON array. Each item must have id, severity, title, what, why, fix, affected.
The fix field should describe the safest rewrite in concrete code-level terms, but do not invent full files.
Allowed severities are critical, high, medium, and low.

Code:
${repoContents.slice(0, 120000)}`;
}

function extractJsonArray(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) return trimmed;
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return "[]";
  return trimmed.slice(start, end + 1);
}

function normalizeFindings(text: string): Finding[] {
  try {
    const parsed = JSON.parse(extractJsonArray(text)) as Array<Partial<Finding>>;
    return parsed
      .filter((finding) => finding.id && finding.severity && finding.title && finding.what && finding.why && finding.fix)
      .map((finding, index) => ({
        id: String(finding.id ?? `code-finding-${index}`),
        category: "code" as const,
        severity: finding.severity as Finding["severity"],
        title: String(finding.title),
        what: String(finding.what),
        why: String(finding.why),
        fix: String(finding.fix),
        evidence: finding.evidence ? String(finding.evidence).slice(0, 500) : undefined,
        affected: Array.isArray(finding.affected) ? finding.affected.map(String).slice(0, 8) : undefined
      }));
  } catch {
    return [];
  }
}

export async function analyzeRepoCode(repoContents: string): Promise<Finding[]> {
  if (!env.GEMINI_API_KEY || !repoContents.trim()) return [];

  const model = env.GEMINI_MODEL || "gemini-3.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: makePrompt(repoContents) }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000
      }
    })
  });

  if (!response.ok) return [];
  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "[]";

  return normalizeFindings(text);
}
