import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";
import { env } from "@/lib/env";

export default function SignInPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <AuthForm appwriteEndpoint={env.APPWRITE_ENDPOINT || ""} appwriteProjectId={env.APPWRITE_PROJECT_ID || ""} mode="sign-in" />
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
