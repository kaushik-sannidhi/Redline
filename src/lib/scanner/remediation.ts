import type { Finding, RemediationResult } from "@/lib/types";
import type { GitHubSourceFile } from "@/lib/github";
import { env } from "@/lib/env";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

function extractText(data: GeminiResponse) {
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
}

function fallbackFix(file: GitHubSourceFile, findings: Finding[]): RemediationResult {
  const summary = findings.map((finding) => `- ${finding.title}: ${finding.fix}`).join("\n");
  const fixed = `${file.content.trimEnd()}\n\n/* Redline remediation notes\n${summary}\n*/\n`;

  return {
    filePath: file.path,
    original: file.content,
    fixed,
    changesSummary: "Added a Redline remediation note because Gemini is not configured for automatic rewriting."
  };
}

async function callGemini(prompt: string, maxOutputTokens = 4096) {
  if (!env.GEMINI_API_KEY) return "";
  const model = env.GEMINI_MODEL || "gemini-2.0-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens }
    })
  });

  if (!response.ok) return "";
  return extractText((await response.json()) as GeminiResponse);
}

function stripCodeFence(text: string) {
  return text.replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/\s*```$/, "").trim();
}

export async function explainFindingFix(finding: Finding, stack: string[]): Promise<string> {
  const prompt = `A ${stack.join(", ") || "web"} app has this security issue:

Title: ${finding.title}
Problem: ${finding.what}
Why it matters: ${finding.why}
Current suggested fix: ${finding.fix}

Write a specific, copy-pasteable fix for this exact issue.
Include actual code snippets they can drop into their project.
Write for a non-security PM who built their app with an AI coding tool.
Keep it under 200 words. No preamble.`;

  const fix = await callGemini(prompt, 1800);
  return fix || finding.fix;
}

export async function remediateFiles(files: GitHubSourceFile[], findings: Finding[], stack: string[]): Promise<RemediationResult[]> {
  const autoFixable = findings.filter((finding) => finding.autoFixable);
  const results: RemediationResult[] = [];

  for (const file of files) {
    const fileFindings = autoFixable.filter((finding) =>
      finding.affected?.some((affected) => affected === file.path || affected.endsWith(`/${file.path}`) || file.path.endsWith(affected))
    );
    if (!fileFindings.length) continue;

    if (!env.GEMINI_API_KEY) {
      results.push(fallbackFix(file, fileFindings));
      continue;
    }

    const prompt = `Rewrite this ${stack.join(", ") || "web app"} source file to fix the listed security findings.
Return ONLY the complete fixed file content. Do not use markdown fences.

File: ${file.path}
Findings:
${fileFindings.map((finding) => `- ${finding.title}: ${finding.what} Fix: ${finding.fix}`).join("\n")}

Original file:
${file.content}`;

    const fixed = stripCodeFence(await callGemini(prompt));
    results.push({
      filePath: file.path,
      original: file.content,
      fixed: fixed || file.content,
      changesSummary: `Rewrote ${fileFindings.length} finding${fileFindings.length === 1 ? "" : "s"} in ${file.path}.`
    });
  }

  if (!results.length && autoFixable.length) {
    const notes = {
      path: "REDLINE_REMEDIATION.md",
      content: "# Redline remediation plan\n"
    };
    results.push(fallbackFix(notes, autoFixable));
  }

  return results;
}
