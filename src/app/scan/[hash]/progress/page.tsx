import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ScanProgress } from "@/components/ScanProgress";

export default function ProgressPage({ params }: { params: { hash: string } }) {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-ink">
          Back to scanner
        </Link>
        <h1 className="mt-4 text-4xl font-black text-ink">Scanning your app</h1>
        <p className="mt-3 text-gray-700">
          Redline streams the quick checks first, then finishes the browser crawl and score.
        </p>
        <div className="mt-8">
          <ScanProgress hash={params.hash} />
        </div>
      </section>
    </main>
  );
}
