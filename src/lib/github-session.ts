import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { Query } from "node-appwrite";
import {
  createAppwriteAdminClient,
  getAppwriteSessionCookieName
} from "@/lib/appwrite/server";
import {
  fetchGitHubOAuthUser,
  fetchGitHubPrimaryEmail,
  type GitHubOAuthUser
} from "@/lib/github-oauth";

function githubUserId(githubId: number) {
  return `gh${githubId}`.slice(0, 36);
}

function randomPassword() {
  return randomBytes(24).toString("base64url");
}

async function resolveGitHubEmail(user: GitHubOAuthUser, accessToken: string) {
  if (user.email) return user.email;
  return fetchGitHubPrimaryEmail(accessToken);
}

export async function ensureAppwriteSessionFromGitHub(accessToken: string) {
  const appwrite = createAppwriteAdminClient();
  if (!appwrite) throw new Error("Appwrite is not configured");

  const githubUser = await fetchGitHubOAuthUser(accessToken);
  const email = await resolveGitHubEmail(githubUser, accessToken);
  if (!email) throw new Error("GitHub did not return a verified email address");

  const preferredUserId = githubUserId(githubUser.id);
  const existingByEmail = await appwrite.users.list({
    queries: [Query.equal("email", email), Query.limit(1)]
  });
  let userId = existingByEmail.users[0]?.$id ?? preferredUserId;

  if (!existingByEmail.users.length) {
    try {
      await appwrite.users.create({
        userId: preferredUserId,
        email,
        password: randomPassword(),
        name: githubUser.name || githubUser.login
      });
      userId = preferredUserId;
    } catch {
      const existingById = await appwrite.users.list({
        queries: [Query.equal("$id", preferredUserId), Query.limit(1)]
      });
      userId = existingById.users[0]?.$id ?? preferredUserId;
    }
  }

  const session = await appwrite.users.createSession({ userId });
  return { session, githubUser, email };
}

export function applyAppwriteSessionCookie(
  session: { secret: string; expire: string },
  requestUrl: string
) {
  const request = new URL(requestUrl);
  cookies().set(getAppwriteSessionCookieName(), session.secret, {
    httpOnly: true,
    secure: request.protocol === "https:",
    sameSite: "lax",
    expires: new Date(session.expire),
    path: "/"
  });
}
