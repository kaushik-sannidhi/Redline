export function detectStack(input: { url: string; headers: Record<string, string>; html: string }): string[] {
  const stack = new Set<string>();
  const html = input.html.toLowerCase();
  const poweredBy = input.headers["x-powered-by"]?.toLowerCase() ?? "";
  const server = input.headers.server?.toLowerCase() ?? "";

  if (poweredBy.includes("next.js") || html.includes("__next_data__")) stack.add("Next.js");
  if (html.includes("__vite__") || poweredBy.includes("vite")) stack.add("Vite");
  if (html.includes("supabase") || html.includes("supabase-js")) stack.add("Supabase");
  if (server.includes("vercel") || input.headers["x-vercel-id"]) stack.add("Vercel");
  if (html.includes("lovable") || html.includes("gpt-engineer")) stack.add("Lovable");
  if (html.includes("bolt.new") || html.includes("stackblitz")) stack.add("Bolt");
  if (html.includes("v0.dev") || html.includes("shadcn")) stack.add("v0");
  if (html.includes("replit")) stack.add("Replit");
  if (html.includes("firebase") || html.includes("firebaseapp")) stack.add("Firebase");

  return Array.from(stack);
}
