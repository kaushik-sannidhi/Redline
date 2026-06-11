"use client";

import { track } from "@/lib/analytics";

export function ConnectGitHubButton({
  label = "Connect GitHub",
  mode = "login"
}: {
  label?: string;
  mode?: "login" | "connect";
}) {
  function connect() {
    track("github_connected", { mode });
    window.location.assign(mode === "connect" ? "/auth/github" : "/auth/github/login");
  }

  return (
    <button className="rounded bg-ink px-4 py-2 font-semibold text-white" onClick={connect} type="button">
      {label}
    </button>
  );
}
