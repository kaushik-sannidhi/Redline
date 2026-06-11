import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getAuthenticatedUser } from "@/lib/auth";
import { getScanStats } from "@/lib/scans";

const onboarding = [
  {
    title: "Create a workspace",
    text: "Sign in with GitHub for repo analysis, or use email locally while you are testing the flow."
  },
  {
    title: "Scan the deployed URL",
    text: "Paste the link you are about to send to real users. Redline logs every run in the dashboard."
  },
  {
    title: "Fix and rescan",
    text: "Open the report, filter by severity, ask Gemini for fixes, download remediated files, then run it again."
  }
];

const commonFindings = [
  "API keys shipped in public JavaScript bundles",
  "No XSS protection header",
  "Cross-site request rules set to allow everyone",
  "Auth tokens stored in browser storage",
  "Debug logs printing user data"
];

export default async function Home() {
  const [user, stats] = await Promise.all([getAuthenticatedUser(), getScanStats()]);
  const primaryHref = user ? "/dashboard" : "/sign-up";

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl content-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-danger">Pre-launch security workspace</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
            Run this before you share the link.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
            Redline gives founders a dashboard for scanning AI-built apps, tracking every run, and turning findings into plain-English fixes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded bg-ink px-5 py-3 font-semibold text-white" href={primaryHref}>
              {user ? "Open dashboard" : "Start free scan"}
            </Link>
            <Link className="rounded border border-line bg-white px-5 py-3 font-semibold hover:border-ink" href="/sign-in">
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm font-medium text-gray-600">Built by a MITRE security researcher. Designed for the moment before launch.</p>
        </div>

        <div className="grid content-center gap-4">
          <div className="rounded border border-line bg-white p-5 shadow-crisp">
            <div className="grid grid-cols-3 divide-x divide-line text-center">
              <div>
                <p className="text-3xl font-black text-ink">{stats.scansRun}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">scans logged</p>
              </div>
              <div>
                <p className="text-3xl font-black text-danger">{stats.keysFound}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">keys found</p>
              </div>
              <div>
                <p className="text-3xl font-black text-ready">{stats.appsSecured}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">apps secured</p>
              </div>
            </div>
          </div>

          <section className="rounded border border-line bg-white p-5 shadow-crisp">
            <h2 className="text-xl font-black text-ink">How onboarding works</h2>
            <div className="mt-4 space-y-4">
              {onboarding.map((step, index) => (
                <div className="flex gap-3" key={step.title}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-paper text-sm font-black text-ink">{index + 1}</span>
                  <div>
                    <h3 className="font-black text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded border border-line bg-white p-5 shadow-crisp">
            <h2 className="text-xl font-black text-ink">Common issues Redline catches</h2>
            <ol className="mt-4 space-y-3">
              {commonFindings.map((finding, index) => (
                <li className="flex gap-3 text-sm text-gray-700" key={finding}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-paper font-bold text-ink">{index + 1}</span>
                  {finding}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </main>
  );
}
