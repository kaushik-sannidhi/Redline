import type { Finding } from "@/lib/types";

const SECURITY_HEADER_CHECKS: Array<{
  id: string;
  header: string;
  severity: Finding["severity"];
  title: string;
  what: string;
  why: string;
  fix: string;
}> = [
  {
    id: "missing-csp",
    header: "content-security-policy",
    severity: "high",
    title: "No XSS protection configured",
    what: "Your app has no XSS protection header.",
    why: "Without it, attackers have an easier path to inject malicious scripts into your pages.",
    fix: "Add a Content-Security-Policy header, starting with: default-src 'self'."
  },
  {
    id: "missing-hsts",
    header: "strict-transport-security",
    severity: "high",
    title: "HTTPS not enforced on return visits",
    what: "No HTTPS enforcement header was found.",
    why: "A returning visitor could be downgraded to an unsafe connection on hostile networks.",
    fix: "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains."
  },
  {
    id: "missing-x-frame",
    header: "x-frame-options",
    severity: "medium",
    title: "Clickjacking protection missing",
    what: "Your app can be embedded inside another website.",
    why: "Attackers can trick users into clicking your app while it is hidden in a frame.",
    fix: "Add: X-Frame-Options: DENY."
  },
  {
    id: "missing-xcto",
    header: "x-content-type-options",
    severity: "low",
    title: "Browser file guessing is allowed",
    what: "No browser file-type safety header was found.",
    why: "Browsers may guess file types incorrectly, which can make some attacks easier.",
    fix: "Add: X-Content-Type-Options: nosniff."
  },
  {
    id: "missing-referrer",
    header: "referrer-policy",
    severity: "low",
    title: "Referrer data may leak to third parties",
    what: "No referrer privacy rule was found.",
    why: "URLs your users visit may be shared with third-party services.",
    fix: "Add: Referrer-Policy: strict-origin-when-cross-origin."
  },
  {
    id: "missing-permissions",
    header: "permissions-policy",
    severity: "low",
    title: "Browser feature access is not restricted",
    what: "No browser feature access rule was found.",
    why: "Third-party scripts may be able to ask for camera, microphone, or location access.",
    fix: "Add: Permissions-Policy: camera=(), microphone=(), geolocation=()."
  }
];

export async function analyzeHeaders(url: string): Promise<{ findings: Finding[]; headers: Record<string, string> }> {
  let response: Response;
  try {
    response = await fetch(url, { redirect: "follow", cache: "no-store" });
  } catch {
    return {
      headers: {},
      findings: [
        {
          id: "url-unreachable",
          category: "header",
          severity: "critical",
          title: "URL could not be reached",
          what: "Redline could not connect to this URL.",
          why: "If Redline cannot reach it, neither can your users.",
          fix: "Verify the URL is publicly deployed and not behind a login wall.",
          affected: [url]
        }
      ]
    };
  }

  const headers = Object.fromEntries(response.headers.entries());
  const findings: Finding[] = [];

  const corsHeader = headers["access-control-allow-origin"];
  if (corsHeader === "*") {
    findings.push({
      id: "open-cors",
      category: "header",
      severity: "high",
      title: "Any website can call this app",
      what: "Your cross-site request rules allow every website.",
      why: "A malicious site may be able to make requests to your backend from a user's browser.",
      fix: "Set Access-Control-Allow-Origin to your own domain instead of *.",
      evidence: corsHeader,
      affected: [url]
    });
  }

  for (const check of SECURITY_HEADER_CHECKS) {
    if (!headers[check.header]) {
      findings.push({
        ...check,
        category: "header",
        affected: [url]
      });
    }
  }

  const setCookie = headers["set-cookie"];
  if (setCookie && !/httponly/i.test(setCookie)) {
    findings.push({
      id: "cookie-no-httponly",
      category: "header",
      severity: "high",
      title: "Session cookies are readable by JavaScript",
      what: "A cookie was set without JavaScript read protection.",
      why: "Injected or third-party scripts could read this cookie.",
      fix: "Set authentication cookies with HttpOnly, Secure, and SameSite=Strict.",
      affected: [url]
    });
  }
  if (setCookie && !/secure/i.test(setCookie)) {
    findings.push({
      id: "cookie-no-secure",
      category: "header",
      severity: "medium",
      title: "Cookies can travel over unsafe connections",
      what: "A cookie was set without the Secure flag.",
      why: "That cookie could be exposed if the browser ever makes an unsafe request.",
      fix: "Set authentication cookies with the Secure flag.",
      affected: [url]
    });
  }

  return { findings, headers };
}
