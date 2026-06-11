import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { SiteHeader } from "@/components/SiteHeader";

export default function SignUpPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <AuthForm mode="sign-up" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-danger">Onboarding</p>
          <h2 className="mt-3 text-5xl font-black leading-none text-ink">Start with the app you are about to share.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-gray-700">
            Create a workspace, paste your deployed URL, optionally add a GitHub repo, and Redline will keep every scan log in your dashboard.
          </p>
          <Link className="mt-6 inline-block text-sm font-bold text-ink underline" href="/sign-in">
            Already have an account? Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
