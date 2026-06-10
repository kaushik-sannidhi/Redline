import type { Finding } from "@/lib/types";

type SecretPattern = {
  id: string;
  label: string;
  pattern: RegExp;
  severity: "critical" | "high";
};

export const SECRET_PATTERNS: SecretPattern[] = [
  { id: "openai-key", label: "OpenAI API key", pattern: /sk-[A-Za-z0-9]{32,64}/g, severity: "critical" },
  { id: "stripe-live", label: "Stripe live secret key", pattern: /sk_live_[A-Za-z0-9]{24,}/g, severity: "critical" },
  { id: "stripe-pub", label: "Stripe publishable key", pattern: /pk_live_[A-Za-z0-9]{24,}/g, severity: "high" },
  { id: "aws-key", label: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/g, severity: "critical" },
  { id: "aws-secret", label: "Possible AWS secret key", pattern: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*["']?[A-Za-z0-9/+]{40}["']?/g, severity: "high" },
  { id: "supabase-key", label: "Supabase service key", pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{100,}/g, severity: "critical" },
  { id: "github-token", label: "GitHub personal token", pattern: /ghp_[A-Za-z0-9]{36}/g, severity: "critical" },
  { id: "firebase-key", label: "Firebase API key", pattern: /AIza[0-9A-Za-z\-_]{35}/g, severity: "high" },
  { id: "anthropic-key", label: "Anthropic API key", pattern: /sk-ant-[A-Za-z0-9\-_]{60,}/g, severity: "critical" },
  { id: "generic-secret", label: "Possible hardcoded secret", pattern: /(?:secret|password|api_key|apikey|access_token)\s*[:=]\s*["'][A-Za-z0-9\-_]{16,}["']/gi, severity: "high" }
];

function findingForMatch(pattern: SecretPattern, match: string, affected: string): Finding {
  return {
    id: pattern.id,
    category: "secret",
    severity: pattern.severity,
    title: `${pattern.label} exposed in client-side JavaScript`,
    what: `A ${pattern.label} was found in code that visitors can download.`,
    why: "Anyone who visits your site can extract this value and use it against your account or data.",
    fix: "Move this key to a server-side environment variable. Never import secret keys in client-side code.",
    evidence: `${match.slice(0, 20)}...`,
    affected: [affected]
  };
}

export function scanTextForSecrets(code: string, affected: string): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const pattern of SECRET_PATTERNS) {
    const matches = code.match(pattern.pattern);
    if (!matches) continue;
    const key = `${pattern.id}:${affected}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push(findingForMatch(pattern, matches[0], affected));
  }

  return findings;
}

export async function scanScriptUrls(scriptUrls: string[]): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const scriptUrl of scriptUrls) {
    try {
      const response = await fetch(scriptUrl, { cache: "no-store" });
      if (!response.ok) continue;
      findings.push(...scanTextForSecrets(await response.text(), scriptUrl));
    } catch {
      // Scripts from third parties or blocked assets should not fail the scan.
    }
  }

  return findings;
}
