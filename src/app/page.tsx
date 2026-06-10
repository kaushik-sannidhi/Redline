import { SiteHeader } from "@/components/SiteHeader";
import { UrlScanForm } from "@/components/UrlScanForm";
import { env, getBaseUrl } from "@/lib/env";

const commonFindings = [
  "API keys shipped in public JavaScript bundles",
  "No XSS protection header",
  "Cross-site request rules set to allow everyone",
  "Auth tokens stored in browser storage",
  "Debug logs printing user data"
];

export default function Home() {
  const demoUrl = env.DEMO_APP_URL || `${getBaseUrl()}/demo`;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl content-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-danger">Pre-launch security check</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
            Run this before you share the link.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
            Redline scans AI-built apps for security issues and explains every finding in plain English. No security expertise
            needed.
          </p>
          <div className="mt-8 max-w-2xl">
            <UrlScanForm defaultUrl={demoUrl} />
          </div>
          <p className="mt-6 text-sm font-medium text-gray-600">Built by a MITRE security researcher. Used before shipping.</p>
        </div>
        <div className="grid content-center gap-4">
          <div className="rounded border border-line bg-white p-5 shadow-crisp">
            <div className="grid grid-cols-3 divide-x divide-line text-center">
              <div>
                <p className="text-3xl font-black text-ink">128</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">scans run</p>
              </div>
              <div>
                <p className="text-3xl font-black text-danger">31</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">keys found</p>
              </div>
              <div>
                <p className="text-3xl font-black text-ready">54</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">apps fixed</p>
              </div>
            </div>
          </div>
          <section className="rounded border border-line bg-white p-5 shadow-crisp">
            <h2 className="text-xl font-black text-ink">The most common mistakes in AI-built apps</h2>
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
