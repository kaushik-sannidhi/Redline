import { headers } from "next/headers";
import { SiteHeader } from "@/components/SiteHeader";
import { UrlScanForm } from "@/components/UrlScanForm";
import { env } from "@/lib/env";
import { getScanStats } from "@/lib/scans";

const commonFindings = [
  { severity: "Critical", title: "API keys shipped in public JavaScript bundles" },
  { severity: "High", title: "No XSS protection header" },
  { severity: "High", title: "Cross-site request rules set to allow everyone" },
  { severity: "High", title: "Auth tokens stored in browser storage" },
  { severity: "Medium", title: "Debug logs printing user data" }
];

export default async function Home() {
  const stats = await getScanStats();
  const host = headers().get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const demoUrl = env.DEMO_APP_URL || `${proto}://${host}/demo`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader variant="dark" />
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl content-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="flex flex-col justify-center">
          <h1 className="max-w-3xl text-5xl font-black leading-none text-white sm:text-6xl lg:text-7xl">
            Run this before you share the link.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Redline scans AI-built apps for security issues. Every finding is plain English, ranked by severity, and paired with a concrete fix.
          </p>
          <div className="mt-8">
            <UrlScanForm defaultUrl={demoUrl} />
          </div>
          <p className="mt-6 text-sm font-medium text-zinc-400">Built by a MITRE security researcher. No account required for the first scan.</p>
        </div>

        <div className="grid content-center gap-4">
          <div className="rounded border border-white/10 bg-zinc-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-sm text-red-400">latest demo report</p>
                <h2 className="mt-1 text-2xl font-black">Not ready to ship</h2>
              </div>
              <p className="font-mono text-5xl font-black text-red-400">18</p>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              {[
                ["3", "Critical"],
                ["5", "High"],
                ["2", "Medium"],
                ["4", "Low"]
              ].map(([count, label]) => (
                <div className="rounded bg-white/[0.04] p-3" key={label}>
                  <p className="font-mono text-2xl font-black">{count}</p>
                  <p className="mt-1 text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {commonFindings.slice(0, 3).map((finding) => (
                <div className="flex items-start gap-3 rounded border border-white/10 bg-black p-3" key={finding.title}>
                  <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                  <div>
                    <p className="font-mono text-xs text-red-300">{finding.severity}</p>
                    <p className="mt-1 text-sm text-zinc-200">{finding.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-white/10 bg-zinc-950 p-5">
            <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
              <div>
                <p className="font-mono text-3xl font-black text-white">{stats.scansRun}</p>
                <p className="text-xs text-zinc-500">scans run</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-black text-red-400">{stats.keysFound}</p>
                <p className="text-xs text-zinc-500">API keys found</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-black text-emerald-400">{stats.appsSecured}</p>
                <p className="text-xs text-zinc-500">apps secured</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-zinc-950 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black text-white">What Redline finds in 7 out of 10 vibe-coded apps</h2>
          <div className="mt-6 grid gap-3 lg:grid-cols-5">
            {commonFindings.map((finding) => (
              <div className="rounded border border-white/10 bg-black p-4" key={finding.title}>
                <p className="font-mono text-xs text-red-300">{finding.severity}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-200">{finding.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
