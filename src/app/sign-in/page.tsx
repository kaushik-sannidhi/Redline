import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { env } from "@/lib/env";

const authMessages: Record<string, string> = {
  "github-failed": "GitHub sign-in failed. Try again or use email and password.",
  "github-connect-requires-login": "Sign in first, then connect GitHub from the dashboard to list private repositories.",
  "appwrite-not-configured": "Appwrite auth is not configured on this deployment."
};

export default function SignInPage({
  searchParams
}: {
  searchParams?: { auth?: string; reason?: string };
}) {
  const authNotice = searchParams?.auth ? authMessages[searchParams.auth] : null;

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          {authNotice ? (
            <div className="mb-4 rounded border border-line bg-white px-4 py-3 text-sm text-gray-700 shadow-crisp">
              {authNotice}
              {searchParams?.reason ? <span className="mt-1 block text-xs text-gray-500">{searchParams.reason}</span> : null}
            </div>
          ) : null}
          <AuthForm appwriteEndpoint={env.APPWRITE_ENDPOINT || ""} appwriteProjectId={env.APPWRITE_PROJECT_ID || ""} mode="sign-in" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-danger">Workspace access</p>
          <h2 className="mt-3 text-5xl font-black leading-none text-ink">Your scan history lives here.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-gray-700">
            Sign in to review previous scans, rerun checks before launch, and keep a record of what changed between reports.
          </p>
          <Link className="mt-6 inline-block text-sm font-bold text-ink underline" href="/sign-up">
            Need an account? Sign up
          </Link>
        </div>
      </section>
    </main>
  );
}
