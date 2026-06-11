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
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  BROWSERLESS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_NOVUS_APP_ID: z.string().optional(),
  DEMO_APP_URL: z.string().url().optional().or(z.literal("")),
  APP_URL: z.string().url().optional().or(z.literal("")),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_APP_ID: z.string().optional()
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  APPWRITE_ENDPOINT: parsedEnv.APPWRITE_ENDPOINT || parsedEnv.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: parsedEnv.APPWRITE_PROJECT_ID || parsedEnv.NEXT_PUBLIC_APPWRITE_PROJECT_ID
};

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

function originFromRequest(request: Request): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  if (!host) return null;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || (request.url.startsWith("https://") ? "https" : "http");
  return `${proto}://${host}`;
}

export function getRequestOrigin(request?: Request | string): string {
  if (env.APP_URL) return new URL(env.APP_URL).origin;

  if (request instanceof Request) {
    return originFromRequest(request) ?? new URL(request.url).origin;
  }

  if (typeof request === "string") {
    return new URL(request).origin;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getBaseUrl(request?: Request | string): string {
  return getRequestOrigin(request);
}
