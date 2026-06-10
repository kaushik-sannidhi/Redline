const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".env",
  ".sql",
  ".py",
  ".rb",
  ".go",
  ".java",
  ".cs",
  ".php"
]);

const SOURCE_FILE_LIMIT = 24;
const SOURCE_CHAR_LIMIT = 120000;

type GitHubRepo = {
  owner: string;
  repo: string;
};

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree" | string;
  size?: number;
  url?: string;
};

function githubHeaders(accessToken?: string | null): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
}

function extensionFor(path: string) {
  const filename = path.toLowerCase();
  if (filename.endsWith(".env") || filename.includes(".env.")) return ".env";
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot);
}

function isInterestingSource(path: string) {
  if (path.includes("node_modules/") || path.includes("dist/") || path.includes(".next/")) return false;
  return SOURCE_EXTENSIONS.has(extensionFor(path));
}

export function parseGitHubRepoUrl(repoUrl: string): GitHubRepo | null {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    return null;
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
  const [, owner, rawRepo] = url.pathname.split("/");
  if (!owner || !rawRepo) return null;
  return { owner, repo: rawRepo.replace(/\.git$/, "") };
}

export function githubRawPackageUrl(repoUrl: string) {
  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) return null;
  return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/package.json`;
}

export async function fetchGitHubPackageJson(repoUrl: string, accessToken?: string | null) {
  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) return "";

  try {
    const metadata = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      cache: "no-store",
      headers: githubHeaders(accessToken)
    });
    if (!metadata.ok) return "";
    const repo = (await metadata.json()) as { default_branch?: string };
    const branch = repo.default_branch ?? "main";

    const response = await fetch(
      `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/package.json`,
      { cache: "no-store", headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined }
    );
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
}

export async function fetchGitHubSourceSnapshot(repoUrl: string, accessToken?: string | null) {
  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) return "";

  try {
    const metadata = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      cache: "no-store",
      headers: githubHeaders(accessToken)
    });
    if (!metadata.ok) return "";
    const repo = (await metadata.json()) as { default_branch?: string };
    const branch = repo.default_branch ?? "main";

    const treeResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { cache: "no-store", headers: githubHeaders(accessToken) }
    );
    if (!treeResponse.ok) return "";

    const treeData = (await treeResponse.json()) as { tree?: GitHubTreeItem[] };
    const files = (treeData.tree ?? [])
      .filter((item) => item.type === "blob" && item.path && isInterestingSource(item.path))
      .filter((item) => !item.size || item.size <= 50000)
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, SOURCE_FILE_LIMIT);

    const chunks: string[] = [];
    let total = 0;

    for (const file of files) {
      if (total >= SOURCE_CHAR_LIMIT) break;
      const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${file.path}`;
      const response = await fetch(rawUrl, {
        cache: "no-store",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      });
      if (!response.ok) continue;

      const remaining = SOURCE_CHAR_LIMIT - total;
      const text = (await response.text()).slice(0, remaining);
      chunks.push(`// FILE: ${file.path}\n${text}`);
      total += text.length;
    }

    return chunks.join("\n\n");
  } catch {
    return "";
  }
}
