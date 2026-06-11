import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { EmbedBadge } from "@/components/EmbedBadge";
import { ReportFindings } from "@/components/ReportFindings";
import { RemediationPanel } from "@/components/RemediationPanel";
import { RescanButton } from "@/components/RescanButton";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { ShareButton } from "@/components/ShareButton";
import { SiteHeader } from "@/components/SiteHeader";
import { StackBadge } from "@/components/StackBadge";
import { getScan } from "@/lib/scans";

export default async function ReportPage({ params }: { params: { hash: string } }) {
  const scan = await getScan(params.hash);
  if (!scan) notFound();
  const autoFixableFindings = scan.findings.filter((finding) => finding.autoFixable);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-ink">
            Scan another app
          </Link>
          <div className="flex flex-wrap gap-2">
            <ShareButton score={scan.score} />
            <RescanButton hash={scan.hash} previousScore={scan.score} />
            <DownloadPdfButton />
          </div>
        </div>
        <div className="mt-6">
          <ScoreDisplay previousScore={scan.previousScore} score={scan.score} />
        </div>
        <div className="mt-6 flex flex-col gap-3 rounded border border-line bg-white p-5 shadow-crisp">
          <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Scanned URL</p>
          <p className="break-all font-semibold text-ink">{scan.url}</p>
          <StackBadge stack={scan.stack} />
        </div>
        <div className="mt-8">
          <ReportFindings findings={scan.findings} stack={scan.stack} summary={scan.summary} />
        </div>
        {scan.repoUrl ? (
          <div className="mt-8">
            <RemediationPanel autoFixableFindings={autoFixableFindings} hash={scan.hash} />
          </div>
        ) : (
          <div className="mt-8 rounded border border-line bg-white p-5 shadow-crisp">
            <h2 className="text-xl font-black text-ink">Connect a repo for code fixes</h2>
            <p className="mt-2 text-sm text-gray-600">
              Connect GitHub and choose a repository when starting a scan to unlock Gemini-generated pull requests.
            </p>
          </div>
        )}
        {scan.repoUrl ? (
          <div className="mt-4 rounded border border-line bg-white p-5 shadow-crisp">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">Repository</p>
            <p className="mt-2 break-all font-semibold text-ink">{scan.repoUrl}</p>
          </div>
        ) : null}
        <div className="mt-8">
          <EmbedBadge hash={scan.hash} score={scan.score} />
        </div>
      </section>
    </main>
  );
}
