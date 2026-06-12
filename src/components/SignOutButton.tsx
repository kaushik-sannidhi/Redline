"use client";

import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    track("sign_out_completed");
    router.push("/");
    router.refresh();
  }

  return (
    <button className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-ink" onClick={signOut} type="button">
      Sign out
    </button>
  );
}
