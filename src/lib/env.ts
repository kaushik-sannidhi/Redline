import { z } from "zod";

const envSchema = z.object({
  APPWRITE_ENDPOINT: z.string().url().optional().or(z.literal("")),
  APPWRITE_PROJECT_ID: z.string().optional(),
  APPWRITE_PROJECT_NAME: z.string().optional(),
  APPWRITE_API_KEY: z.string().optional(),
  APPWRITE_DATABASE_ID: z.string().optional(),
  APPWRITE_SCANS_TABLE_ID: z.string().optional(),
  APPWRITE_BADGES_TABLE_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  BROWSERLESS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_NOVUS_APP_ID: z.string().optional(),
  DEMO_APP_URL: z.string().url().optional().or(z.literal(""))
});

export const env = envSchema.parse(process.env);

export function hasAppwriteAdminConfig(): boolean {
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
