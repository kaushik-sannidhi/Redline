import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().optional(),
  APPWRITE_ENDPOINT: z.string().url().optional().or(z.literal("")),
  APPWRITE_PROJECT_ID: z.string().optional(),
  APPWRITE_PROJECT_NAME: z.string().optional(),
  APPWRITE_API_KEY: z.string().optional(),
  APPWRITE_DATABASE_ID: z.string().optional(),
  APPWRITE_SCANS_TABLE_ID: z.string().optional(),
  APPWRITE_BADGES_TABLE_ID: z.string().optional(),
  APPWRITE_FORCE_REMOTE: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  BROWSERLESS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_NOVUS_APP_ID: z.string().optional(),
  DEMO_APP_URL: z.string().url().optional().or(z.literal(""))
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  APPWRITE_ENDPOINT: parsedEnv.APPWRITE_ENDPOINT || parsedEnv.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: parsedEnv.APPWRITE_PROJECT_ID || parsedEnv.NEXT_PUBLIC_APPWRITE_PROJECT_ID
};

export function hasAppwriteAdminConfig(): boolean {
  if (process.env.NODE_ENV === "development" && env.APPWRITE_FORCE_REMOTE !== "true") return false;
  return Boolean(
    env.APPWRITE_ENDPOINT &&
      env.APPWRITE_PROJECT_ID &&
      env.APPWRITE_API_KEY &&
      env.APPWRITE_DATABASE_ID &&
      env.APPWRITE_SCANS_TABLE_ID &&
      env.APPWRITE_BADGES_TABLE_ID
  );
}

export function hasAppwriteSessionConfig(): boolean {
  return Boolean(env.APPWRITE_ENDPOINT && env.APPWRITE_PROJECT_ID);
}

export function getBaseUrl(requestUrl?: string): string {
  if (requestUrl) return new URL(requestUrl).origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
