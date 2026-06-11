import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { StackBadge } from "@/components/StackBadge";
import { UrlScanForm } from "@/components/UrlScanForm";
import { getAuthenticatedUser } from "@/lib/auth";
import { getScanStats, listRecentScans, listScansForUser } from "@/lib/scans";
import type { Scan, ScanStatus } from "@/lib/types";

const authMessages: Record<string, string> = {
  "github-connected": "GitHub connected. Your private repositories are now available for scans.",
  "github-failed": "GitHub connection failed. Try connecting again.",
  "github-not-configured": "GitHub OAuth is not configured on this deployment."
};

const statusClasses: Record<ScanStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  running: "bg-yellow-100 text-yellow-900",
  complete: "bg-green-100 text-green-900",
  error: "bg-red-100 text-red-900"
};

function ScanLogRow({ scan }: { scan: Scan }) {
  return (
    <Link className="block border-t border-line px-4 py-4 hover:bg-paper" href={`/report/${scan.hash}`}>
      <div className="grid gap-3 lg:grid-cols-[1.6fr_0.6fr_0.6fr_0.8fr] lg:items-center">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{scan.url}</p>
          {scan.repoUrl ? <p className="mt-1 truncate text-xs text-gray-500">{scan.repoUrl}</p> : null}
        </div>
        <div>
          <span className={`rounded px-2 py-1 text-xs font-black uppercase tracking-wide ${statusClasses[scan.status]}`}>
            {scan.status}
          </span>
        </div>
        <p className="font-black text-ink">{scan.score}/100</p>
        <div className="text-sm text-gray-600">
          <p>{scan.summary.total} findings</p>
          <p className="text-xs">{new Date(scan.createdAt).toLocaleString()}</p>
        </div>
      </div>
      {scan.stack.length ? (
        <div className="mt-3">
          <StackBadge stack={scan.stack} />
        </div>
      ) : null}
    </Link>
  );
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { auth?: string; reason?: string };
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const authNotice = searchParams?.auth ? authMessages[searchParams.auth] : null;

  const host = headers().get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const demoUrl = `${proto}://${host}/demo`;
  const [myScans, recentScans, stats] = await Promise.all([listScansForUser(user.$id), listRecentScans(25), getScanStats()]);
  const criticalOpen = myScans.reduce((count, scan) => count + scan.summary.critical, 0);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-danger">Launch workspace</p>
            <h1 className="mt-2 text-4xl font-black text-ink">Dashboard</h1>
            <p className="mt-2 text-gray-700">Signed in as {user.email || user.name || user.$id}</p>
          </div>
          <Link className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink" href="/demo">
            Open demo app
          </Link>
        </div>

        {authNotice ? (
          <div className="mt-6 rounded border border-line bg-white px-4 py-3 text-sm text-gray-700 shadow-crisp">
            {authNotice}
            {searchParams?.reason ? <span className="mt-1 block text-xs text-gray-500">{searchParams.reason}</span> : null}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded border border-line bg-white p-5 shadow-crisp">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">My scans</p>
            <p className="mt-2 text-4xl font-black text-ink">{myScans.length}</p>
          </div>
          <div className="rounded border border-line bg-white p-5 shadow-crisp">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Critical findings</p>
            <p className="mt-2 text-4xl font-black text-danger">{criticalOpen}</p>
          </div>
          <div className="rounded border border-line bg-white p-5 shadow-crisp">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">All scans logged</p>
            <p className="mt-2 text-4xl font-black text-ink">{stats.scansRun}</p>
          </div>
          <div className="rounded border border-line bg-white p-5 shadow-crisp">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Apps secured</p>
            <p className="mt-2 text-4xl font-black text-ready">{stats.appsSecured}</p>
          </div>
        </div>

        <section className="mt-8 rounded border border-line bg-white p-5 shadow-crisp">
          <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-black text-ink">Run a scan</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Paste the deployed URL you are about to share. Add a GitHub repo when you want code analysis and remediation.
              </p>
            </div>
            <UrlScanForm defaultUrl={demoUrl} />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {["Paste a deployed URL", "Watch the scan progress", "Review findings and fixes"].map((step, index) => (
            <div className="rounded border border-line bg-white p-5 shadow-crisp" key={step}>
              <p className="text-sm font-black text-danger">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-black text-ink">{step}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {index === 0
                  ? "Use the public URL for your AI-built app, staging build, or the built-in vulnerable demo."
                  : index === 1
                    ? "Every run records status, timing, score, stack tags, and severity counts."
                    : "Open any report to copy fixes, request AI help, rescan, export PDF, or generate a badge."}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded border border-line bg-white shadow-crisp">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="text-2xl font-black text-ink">Scan logs</h2>
              <p className="mt-1 text-sm text-gray-600">Every scan Redline knows about, newest first.</p>
            </div>
            <p className="text-sm font-semibold text-gray-500">{recentScans.length} records</p>
          </div>
          {recentScans.length ? (
            <div>
              {recentScans.map((scan) => (
                <ScanLogRow key={scan.hash} scan={scan} />
              ))}
            </div>
          ) : (
            <div className="border-t border-line p-5 text-sm text-gray-600">
              No scans yet. Run the demo scan above and this log will fill in immediately.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
