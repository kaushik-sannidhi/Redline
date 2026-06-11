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
  sha?: string;
  size?: number;
  url?: string;
};

export type GitHubSourceFile = {
  path: string;
  content: string;
  sha?: string;
};

export type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
  defaultBranch: string;
  pushedAt?: string | null;
  permissions?: {
    admin?: boolean;
    maintain?: boolean;
    push?: boolean;
  };
};

export type GitHubPullRequestResult = {
  branchName: string;
  number: number;
  url: string;
};

type GitHubRepositoryApiResponse = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch?: string;
  pushed_at?: string | null;
  permissions?: GitHubRepository["permissions"];
};

type GitHubBlobApiResponse = {
  content?: string;
  encoding?: string;
};

function githubHeaders(accessToken?: string | null): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
}

function toRepository(repo: GitHubRepositoryApiResponse): GitHubRepository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    private: repo.private,
    defaultBranch: repo.default_branch ?? "main",
    pushedAt: repo.pushed_at ?? null,
    permissions: repo.permissions
  };
}

async function githubJson<T>(
  pathOrUrl: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
  const url = pathOrUrl.startsWith("https://") ? pathOrUrl : `https://api.github.com${pathOrUrl}`;
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...githubHeaders(accessToken),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `GitHub request failed with ${response.status}`);
  }

  return (await response.json()) as T;
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

export async function listGitHubRepositories(accessToken: string): Promise<GitHubRepository[]> {
  const repos: GitHubRepositoryApiResponse[] = [];

  for (let page = 1; page <= 10; page++) {
    const batch = await githubJson<GitHubRepositoryApiResponse[]>(
      `/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`,
      accessToken
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  return repos.map(toRepository);
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
  const files = await fetchGitHubSourceFiles(repoUrl, accessToken);
  return files.map((file) => `// FILE: ${file.path}\n${file.content}`).join("\n\n");
}

export async function fetchGitHubSourceFiles(repoUrl: string, accessToken?: string | null): Promise<GitHubSourceFile[]> {
  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) return [];

  try {
    const metadata = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      cache: "no-store",
      headers: githubHeaders(accessToken)
    });
    if (!metadata.ok) return [];
    const repo = (await metadata.json()) as { default_branch?: string };
    const branch = repo.default_branch ?? "main";

    const treeResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { cache: "no-store", headers: githubHeaders(accessToken) }
    );
    if (!treeResponse.ok) return [];

    const treeData = (await treeResponse.json()) as { tree?: GitHubTreeItem[] };
    const files = (treeData.tree ?? [])
      .filter((item) => item.type === "blob" && item.path && isInterestingSource(item.path))
      .filter((item) => !item.size || item.size <= 50000)
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, SOURCE_FILE_LIMIT);

    const sourceFiles: GitHubSourceFile[] = [];
    let total = 0;

    for (const file of files) {
      if (total >= SOURCE_CHAR_LIMIT) break;
      const remaining = SOURCE_CHAR_LIMIT - total;
      let text = "";

      try {
        if (accessToken && file.sha) {
          const blob = await githubJson<GitHubBlobApiResponse>(
            `/repos/${parsed.owner}/${parsed.repo}/git/blobs/${file.sha}`,
            accessToken
          );
          text =
            blob.encoding === "base64" && blob.content
              ? Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8")
              : "";
        } else {
          const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${file.path}`;
          const response = await fetch(rawUrl, {
            cache: "no-store",
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
          });
          if (!response.ok) continue;
          text = await response.text();
        }
      } catch {
        continue;
      }

      text = text.slice(0, remaining);
      sourceFiles.push({ path: file.path, content: text, sha: file.sha });
      total += text.length;
    }

    return sourceFiles;
  } catch {
    return [];
  }
}

export async function createGitHubPullRequest(input: {
  repoUrl: string;
  accessToken: string;
  title: string;
  body: string;
  files: Array<Pick<GitHubSourceFile, "path" | "sha"> & { fixed: string }>;
  branchPrefix?: string;
}): Promise<GitHubPullRequestResult> {
  const parsed = parseGitHubRepoUrl(input.repoUrl);
  if (!parsed) throw new Error("Only github.com repository URLs are supported");

  const repo = await githubJson<GitHubRepositoryApiResponse>(
    `/repos/${parsed.owner}/${parsed.repo}`,
    input.accessToken
  );
  const defaultBranch = repo.default_branch ?? "main";
  const ref = await githubJson<{ object?: { sha?: string } }>(
    `/repos/${parsed.owner}/${parsed.repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
    input.accessToken
  );
  const baseSha = ref.object?.sha;
  if (!baseSha) throw new Error("Could not read the repository default branch");

  const safePrefix = (input.branchPrefix ?? "redline-fix").replace(/[^a-zA-Z0-9/_-]/g, "-");
  const branchName = `${safePrefix}-${Date.now()}`;

  await githubJson(`/repos/${parsed.owner}/${parsed.repo}/git/refs`, input.accessToken, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    })
  });

  const changedFiles = input.files.filter((file) => file.fixed.trim().length);
  if (!changedFiles.length) throw new Error("Gemini did not produce any file changes");

  for (const file of changedFiles) {
    await githubJson(`/repos/${parsed.owner}/${parsed.repo}/contents/${encodeURIComponent(file.path).replace(/%2F/g, "/")}`, input.accessToken, {
      method: "PUT",
      body: JSON.stringify({
        message: `Fix Redline finding in ${file.path}`,
        content: Buffer.from(file.fixed, "utf8").toString("base64"),
        branch: branchName,
        ...(file.sha ? { sha: file.sha } : {})
      })
    });
  }

  const pullRequest = await githubJson<{ number: number; html_url: string }>(
    `/repos/${parsed.owner}/${parsed.repo}/pulls`,
    input.accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        head: branchName,
        base: defaultBranch,
        body: input.body,
        maintainer_can_modify: true
      })
    }
  );

  return {
    branchName,
    number: pullRequest.number,
    url: pullRequest.html_url
  };
}
