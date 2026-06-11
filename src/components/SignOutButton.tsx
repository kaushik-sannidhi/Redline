"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <button className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-ink" onClick={signOut} type="button">
      Sign out
    </button>
  );
}
