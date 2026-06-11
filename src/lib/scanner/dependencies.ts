import type { Finding } from "@/lib/types";

export async function scanDependenciesFromPackageJson(packageJson: string): Promise<Finding[]> {
  const pkg = JSON.parse(packageJson) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const findings: Finding[] = [];

  for (const [name, versionRange] of Object.entries(deps)) {
    const cleanVersion = versionRange.replace(/^[\^~>=< ]+/, "");
    try {
      const response = await fetch("https://api.osv.dev/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: { name, ecosystem: "npm" }, version: cleanVersion })
      });
      const data = (await response.json()) as { vulns?: unknown[] };
      if (data.vulns?.length) {
        findings.push({
          id: `dep-vuln-${name}`,
          category: "dependency",
          severity: "high",
          title: `${name}@${cleanVersion} has known vulnerabilities`,
          what: `${data.vulns.length} known vulnerability(s) were found in ${name}.`,
          why: "Known vulnerabilities are public and attackers often target them.",
          fix: `Run: npm update ${name}. Check details at https://osv.dev.`,
          affected: ["package.json"],
          autoFixable: true
        });
      }
    } catch {
      // Dependency scanning is additive; network failures should not block URL scans.
    }
  }

  return findings;
}
