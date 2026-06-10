import Link from "next/link";
import { ConnectGitHubButton } from "@/components/ConnectGitHubButton";
import { SiteHeader } from "@/components/SiteHeader";
import { getAuthenticatedUser } from "@/lib/auth";
import { listScansForUser } from "@/lib/scans";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const scans = user ? await listScansForUser(user.$id) : [];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-black text-ink">Dashboard</h1>
        {!user ? (
          <div className="mt-6 rounded border border-line bg-white p-6 shadow-crisp">
            <h2 className="text-xl font-black text-ink">Connect GitHub to save reports</h2>
            <p className="mt-2 text-gray-700">
              First scans stay anonymous. GitHub sign-in unlocks scan history and repository analysis.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ConnectGitHubButton />
              <Link className="rounded border border-line bg-white px-4 py-2 font-semibold hover:border-ink" href="/">
                Run an anonymous scan
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-gray-700">Signed in as {user.email || user.name || user.$id}</p>
            {scans.length ? (
              scans.map((scan) => (
                <Link className="block rounded border border-line bg-white p-5 shadow-crisp hover:border-ink" href={`/report/${scan.hash}`} key={scan.hash}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="break-all font-semibold text-ink">{scan.url}</p>
                    <p className="text-2xl font-black">{scan.score}/100</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{new Date(scan.createdAt).toLocaleString()}</p>
                </Link>
              ))
            ) : (
              <p className="rounded border border-line bg-white p-5 text-gray-700">No saved scans yet.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
