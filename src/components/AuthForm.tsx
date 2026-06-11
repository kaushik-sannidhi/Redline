"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectGitHubButton } from "@/components/ConnectGitHubButton";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not continue");
      router.push("/dashboard");
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not continue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded border border-line bg-white p-6 shadow-crisp">
      <div>
        <h1 className="text-3xl font-black text-ink">{mode === "sign-up" ? "Create your Redline workspace" : "Sign in to Redline"}</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Use GitHub for repository analysis, or continue with email locally to test the full dashboard flow.
        </p>
      </div>
      <div className="mt-6">
        <ConnectGitHubButton label={mode === "sign-up" ? "Sign up with GitHub" : "Sign in with GitHub"} />
      </div>
      <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-gray-400">
        <span className="h-px flex-1 bg-line" />
        Email
        <span className="h-px flex-1 bg-line" />
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div>
          <label className="text-sm font-semibold text-gray-700" htmlFor="email">
            Work email
          </label>
          <input
            className="mt-2 min-h-12 w-full rounded border border-line px-4 outline-none focus:border-ink"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="founder@company.com"
            required
            type="email"
            value={email}
          />
        </div>
        <button
          className="min-h-12 w-full rounded bg-ink px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Continuing..." : mode === "sign-up" ? "Create workspace" : "Continue to dashboard"}
        </button>
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
      </form>
    </div>
  );
}
