import { cookies } from "next/headers";
import { createAppwriteSessionClient } from "@/lib/appwrite/server";

export type RedlineUser = {
  $id: string;
  email?: string;
  name?: string;
};

const DEV_USER_COOKIE = "redline_dev_user";

export function getDevAuthCookieName() {
  return DEV_USER_COOKIE;
}

function getLocalUser(): RedlineUser | null {
  const raw = cookies().get(DEV_USER_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as RedlineUser;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const appwrite = createAppwriteSessionClient();
  if (!appwrite) return getLocalUser()?.$id ?? null;

  try {
    const user = await appwrite.account.get();
    return user.$id;
  } catch {
    return getLocalUser()?.$id ?? null;
  }
}

export async function getAuthenticatedUser(): Promise<RedlineUser | null> {
  const appwrite = createAppwriteSessionClient();
  if (!appwrite) return getLocalUser();

  try {
    const user = await appwrite.account.get();
    return { $id: user.$id, email: user.email, name: user.name };
  } catch {
    return getLocalUser();
  }
}

export async function getGithubProviderToken(): Promise<string | null> {
  const appwrite = createAppwriteSessionClient();
  if (!appwrite) return null;

  try {
    const session = await appwrite.account.getSession({ sessionId: "current" });
    return session.provider === "github" ? session.providerAccessToken || null : null;
  } catch {
    return null;
  }
}
