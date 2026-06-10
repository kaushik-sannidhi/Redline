import { env } from "@/lib/env";

const BROWSERLESS_REGIONS = [
  "production-sfo.browserless.io",
  "production-ams.browserless.io",
  "production-lon.browserless.io"
];

const HTTP_API_PATHS = {
  content: "/content",
  function: "/function",
  pdf: "/pdf",
  screenshot: "/screenshot"
} as const;

function withToken(url: URL) {
  if (env.BROWSERLESS_API_KEY) url.searchParams.set("token", env.BROWSERLESS_API_KEY);
  return url.toString();
}

export function getBrowserlessCdpWsEndpoints(): string[] {
  if (!env.BROWSERLESS_API_KEY) return [];

  return BROWSERLESS_REGIONS.map((host) => withToken(new URL(`wss://${host}/`)));
}

export function getBrowserlessHttpEndpoint(kind: keyof typeof HTTP_API_PATHS, region = BROWSERLESS_REGIONS[0]) {
  if (!env.BROWSERLESS_API_KEY) return null;

  return withToken(new URL(`https://${region}${HTTP_API_PATHS[kind]}`));
}
