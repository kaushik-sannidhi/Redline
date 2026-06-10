"use client";

import { track } from "@/lib/analytics";

export function ConnectGitHubButton() {
  function connect() {
    track("github_connected", {});
    window.location.assign("/auth/github");
  }

  return (
    <button className="rounded bg-ink px-4 py-2 font-semibold text-white" onClick={connect} type="button">
      Connect GitHub
    </button>
  );
}
