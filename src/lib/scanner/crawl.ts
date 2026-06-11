import type { Finding } from "@/lib/types";
import { getBrowserlessCdpWsEndpoints } from "@/lib/browserless";
import { scanScriptUrls, scanTextForSecrets } from "@/lib/scanner/secrets";
import { detectStack } from "@/lib/scanner/stack";

export interface CrawlResult {
  findings: Finding[];
  stack: string[];
  scriptUrls: string[];
}

function extractScriptUrls(html: string, baseUrl: string): string[] {
  const matches = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi));
  return matches
    .map((match) => {
      try {
        return new URL(match[1], baseUrl).href;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value));
}

function extractSameOriginLinks(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  return Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi))
    .map((match) => {
      try {
        return new URL(match[1], baseUrl).href;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value && value.startsWith(origin)));
}

function extractSameOriginFormActions(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  return Array.from(html.matchAll(/<form[^>]+action=["']([^"']+)["']/gi))
    .map((match) => {
      try {
        return new URL(match[1], baseUrl).href;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value && value.startsWith(origin)));
}

function scanHtmlForCrawlFindings(html: string, pageUrl: string): Finding[] {
  const findings: Finding[] = [];

  if (/localStorage\.setItem\(["'][^"']*(token|key|secret|password|auth)[^"']*/i.test(html)) {
    findings.push({
      id: "localstorage-auth-token",
      category: "crawl",
      severity: "high",
      title: "Sensitive data stored in browser storage",
      what: "Your app stores auth-like data in localStorage.",
      why: "Browser storage is readable by any script on the page, including injected or third-party scripts.",
      fix: "Use httpOnly cookies for auth tokens instead of localStorage.",
      affected: [pageUrl],
      autoFixable: true
    });
  }

  if (/<form[\s\S]*method=["']?post["']?/i.test(html) && !/name=["'][^"']*(csrf|_token|authenticity)[^"']*["']/i.test(html)) {
    findings.push({
      id: "missing-csrf",
      category: "crawl",
      severity: "high",
      title: "Form hijacking protection missing",
      what: "A POST form was found without a protection token.",
      why: "Attackers may be able to trick logged-in users into submitting the form.",
      fix: "Add a server-verified CSRF token to all POST forms.",
      affected: [pageUrl],
      autoFixable: true
    });
  }

  if (/console\.log\([^)]*(token|key|secret|password|email|user)/i.test(html)) {
    findings.push({
      id: "console-log-leak",
      category: "crawl",
      severity: "medium",
      title: "Sensitive data printed to browser console",
      what: "The page appears to print user or secret-like data to the browser console.",
      why: "Debug logs often expose data that should not ship to real users.",
      fix: "Remove console.log statements before launch or strip sensitive fields.",
      evidence: "console.log(...)",
      affected: [pageUrl],
      autoFixable: true
    });
  }

  return findings;
}

async function scanFormActionHeaders(actionUrls: string[]): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const actionUrl of actionUrls) {
    try {
      const response = await fetch(actionUrl, { cache: "no-store" });
      if (response.headers.get("access-control-allow-origin") === "*") {
        findings.push({
          id: "open-cors-form-action",
          category: "crawl",
          severity: "high",
          title: "Any website can call this form endpoint",
          what: "A form endpoint allows requests from every website.",
          why: "A malicious site may be able to call this backend from a user's browser.",
          fix: "Set Access-Control-Allow-Origin to your own domain instead of *.",
          evidence: "Access-Control-Allow-Origin: *",
          affected: [actionUrl],
          autoFixable: true
        });
      }
    } catch {
      // Form endpoint checks are additive; a blocked endpoint should not fail the crawl.
    }
  }

  return findings;
}

async function crawlWithFetch(url: string, headers: Record<string, string>): Promise<CrawlResult> {
  const visited = new Set<string>();
  const queue = [url];
  const findings: Finding[] = [];
  const scriptUrls = new Set<string>();
  let firstHtml = "";

  while (queue.length > 0 && visited.size < 10) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    try {
      const response = await fetch(current, { cache: "no-store" });
      const html = await response.text();
      if (!firstHtml) firstHtml = html;
      findings.push(...scanHtmlForCrawlFindings(html, current), ...scanTextForSecrets(html, current));

      for (const scriptUrl of extractScriptUrls(html, current)) scriptUrls.add(scriptUrl);
      findings.push(...(await scanFormActionHeaders(extractSameOriginFormActions(html, current))));
      for (const link of extractSameOriginLinks(html, current)) {
        if (!visited.has(link)) queue.push(link);
      }
    } catch {
      // Keep partial findings instead of failing the whole scan.
    }
  }

  return {
    findings,
    stack: detectStack({ url, headers, html: firstHtml }),
    scriptUrls: Array.from(scriptUrls)
  };
}

async function crawlWithBrowserlessEndpoint(endpoint: string, url: string, headers: Record<string, string>): Promise<CrawlResult> {
  const { chromium } = await import("playwright-core");
  const browser = await chromium.connectOverCDP(endpoint);

  try {
    const page = await browser.newPage();
    const findings: Finding[] = [];
    const consoleLogs: string[] = [];
    const scriptUrls = new Set<string>();
    const visited = new Set<string>();
    const queue = [url];
    let firstHtml = "";

    page.on("console", (message) => {
      if (message.type() === "log") consoleLogs.push(message.text());
    });

    while (queue.length > 0 && visited.size < 10) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      await page.goto(current, { waitUntil: "networkidle", timeout: 15000 });
      const html = await page.content();
      if (!firstHtml) firstHtml = html;

      const localStorageData = await page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index);
          if (key) items[key] = localStorage.getItem(key) ?? "";
        }
        return items;
      });

      for (const [key] of Object.entries(localStorageData)) {
        if (/token|key|secret|password|auth/i.test(key)) {
          findings.push({
            id: `localstorage-${key}`.toLowerCase(),
            category: "crawl",
            severity: "high",
            title: `Sensitive data stored in browser storage (${key})`,
            what: `Your app stores "${key}" in localStorage.`,
            why: "Browser storage is readable by any script on the page, including injected or third-party scripts.",
            fix: "Use httpOnly cookies for auth tokens instead of localStorage.",
            affected: [current],
            autoFixable: true
          });
        }
      }

      const hasUnsafePostForm = await page.locator("form[method='post' i]").evaluateAll((forms) =>
        forms.some((form) => !form.querySelector('input[name*="csrf" i], input[name*="_token" i], input[name*="authenticity" i]'))
      );
      if (hasUnsafePostForm) findings.push(...scanHtmlForCrawlFindings('<form method="post"></form>', current));
      findings.push(...(await scanFormActionHeaders(extractSameOriginFormActions(html, current))));

      const pageScripts = await page.locator("script[src]").evaluateAll((scripts) =>
        scripts.map((script) => (script as HTMLScriptElement).src)
      );
      pageScripts.forEach((script) => scriptUrls.add(script));

      const links = await page.locator("a[href]").evaluateAll(
        (anchors, baseUrl) =>
          anchors
            .map((anchor) => {
              try {
                return new URL((anchor as HTMLAnchorElement).href, baseUrl).href;
              } catch {
                return null;
              }
            })
            .filter(Boolean),
        url
      );
      const origin = new URL(url).origin;
      links.forEach((link) => {
        if (link && link.startsWith(origin) && !visited.has(link)) queue.push(link);
      });
    }

    const leakyLog = consoleLogs.find((log) => /token|key|secret|password|email|user.*id/i.test(log));
    if (leakyLog) {
      findings.push({
        id: "console-log-leak",
        category: "crawl",
        severity: "medium",
        title: "Sensitive data printed to browser console",
        what: "The page prints user or secret-like data to the browser console.",
        why: "Debug logs often expose data that should not ship to real users.",
        fix: "Remove console.log statements before launch or strip sensitive fields.",
        evidence: leakyLog.slice(0, 60),
        autoFixable: true
      });
    }

    return {
      findings,
      stack: detectStack({ url, headers, html: firstHtml }),
      scriptUrls: Array.from(scriptUrls)
    };
  } finally {
    await browser.close();
  }
}

async function crawlWithBrowserless(url: string, headers: Record<string, string>): Promise<CrawlResult> {
  const browserlessEndpoints = getBrowserlessCdpWsEndpoints();
  if (!browserlessEndpoints.length) return crawlWithFetch(url, headers);

  for (const endpoint of browserlessEndpoints) {
    try {
      return await crawlWithBrowserlessEndpoint(endpoint, url, headers);
    } catch {
      // Try the next Browserless region before falling back to fetch-only crawling.
    }
  }

  return crawlWithFetch(url, headers);
}

export async function crawlApp(url: string, headers: Record<string, string>): Promise<CrawlResult> {
  return crawlWithBrowserless(url, headers);
}
