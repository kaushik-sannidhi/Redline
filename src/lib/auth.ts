import { createAppwriteSessionClient } from "@/lib/appwrite/server";

export type RedlineUser = {
  $id: string;
  email?: string;
  name?: string;
};

export async function getAuthenticatedUserId(): Promise<string | null> {
  const appwrite = createAppwriteSessionClient();
  if (!appwrite) return null;

  try {
    const user = await appwrite.account.get();
    return user.$id;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(): Promise<RedlineUser | null> {
  const appwrite = createAppwriteSessionClient();
  if (!appwrite) return null;

  try {
    const user = await appwrite.account.get();
    return { $id: user.$id, email: user.email, name: user.name };
  } catch {
    return null;
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
