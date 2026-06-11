import { cookies } from "next/headers";
import { Account, Client, TablesDB, Users } from "node-appwrite";
import { env, hasAppwriteAdminConfig, hasAppwriteSessionConfig } from "@/lib/env";

export function getAppwriteSessionCookieName() {
  return `a_session_${env.APPWRITE_PROJECT_ID}`;
}

export function getAppwriteJwtCookieName() {
  return "redline_appwrite_jwt";
}

function createBaseClient() {
  if (!env.APPWRITE_ENDPOINT || !env.APPWRITE_PROJECT_ID) return null;
  const client = new Client().setEndpoint(env.APPWRITE_ENDPOINT).setProject(env.APPWRITE_PROJECT_ID);
  if (process.env.NODE_ENV === "development") client.setSelfSigned(true);
  return client;
}

export function createAppwriteAdminClient() {
  if (!hasAppwriteAdminConfig()) return null;
  const client = createBaseClient();
  if (!client || !env.APPWRITE_API_KEY) return null;
  client.setKey(env.APPWRITE_API_KEY);

  return {
    account: new Account(client),
    tables: new TablesDB(client),
    users: new Users(client)
  };
}

export function createAppwritePublicClient() {
  const client = createBaseClient();
  if (!client) return null;

  return {
    account: new Account(client),
    tables: new TablesDB(client)
  };
}

export function createAppwriteSessionClient() {
  if (!hasAppwriteSessionConfig()) return null;
  const client = createBaseClient();
  if (!client) return null;

  const jwt = cookies().get(getAppwriteJwtCookieName())?.value;
  const session = cookies().get(getAppwriteSessionCookieName())?.value;
  if (jwt) client.setJWT(jwt);
  else if (session) client.setSession(session);
  else return null;

  return {
    account: new Account(client),
    tables: new TablesDB(client)
  };
}

export function getAppwriteTableIds() {
  if (!env.APPWRITE_DATABASE_ID || !env.APPWRITE_SCANS_TABLE_ID || !env.APPWRITE_BADGES_TABLE_ID) return null;
  return {
    databaseId: env.APPWRITE_DATABASE_ID,
    scansTableId: env.APPWRITE_SCANS_TABLE_ID,
    badgesTableId: env.APPWRITE_BADGES_TABLE_ID
  };
}
