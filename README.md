# Redline

Redline it before you ship.

Redline is a pre-launch security scanner for AI-built apps. Paste a URL, get a Vibe Security Score, and read plain-English fixes.

## What is implemented

- Anonymous scan creation: `POST /api/scan`
- Live progress streaming: `GET /api/scan/[hash]/stream`
- Public reports: `/report/[hash]`
- Header checks, script secret scanning, fetch-based crawl fallback, and Browserless Playwright crawl when configured
- Vulnerable demo app at `/demo`
- Appwrite TablesDB persistence and Appwrite Auth for GitHub sign-in/history
- GitHub repo analysis endpoint with Gemini API + OSV support
- Badge SVG endpoint, rescan flow, print-to-PDF, share link, and Novus event hooks

## Setup

```bash
npm install
npm run dev
```

Create `.env.local` with the values your environment needs. Required for production persistence and auth:

```bash
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=6a296d2600224c5f6084
APPWRITE_PROJECT_NAME=Redline
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_SCANS_TABLE_ID=scans
APPWRITE_BADGES_TABLE_ID=badges
```

Required for production browser crawling:

```bash
BROWSERLESS_API_KEY=
```

Optional integrations:

```bash
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
NEXT_PUBLIC_NOVUS_APP_ID=
DEMO_APP_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_ID=
```

GitHub App setup for private repository access:

1. In your GitHub App settings, enable user authorization (OAuth).
2. Set the callback URL to `https://your-domain/auth/github/callback` (and `http://localhost:3000/auth/github/callback` for local dev).
3. Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_APP_ID` to your environment.

Create the Appwrite TablesDB schema described in `appwrite/schema.md` before enabling production persistence.
The browser Appwrite SDK is initialized in `src/lib/appwrite/client.ts`, and `client.ping()` is called automatically from the root layout through `src/components/AppwritePing.tsx`.

Gemini is used through the server-side API key because consumer AI subscriptions do not expose a third-party app API for background code rewriting or repository analysis. If a provider adds delegated subscription access later, keep those user-scoped tokens server-side and route them through `src/lib/scanner/code.ts`.

## Verification

```bash
npm run lint
npm test
npm run build
```

Manual smoke path:

1. Run the app locally.
2. Open `/`.
3. Click `Scan demo app`.
4. Watch `/scan/[hash]/progress`.
5. Confirm `/report/[hash]` shows header, secret, localStorage, console, and form findings.

## Deployment Notes

- Deploy the Next.js app to Vercel.
- Configure your GitHub App callback URL to `/auth/github/callback` and set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in the deployment environment.
- Set `BROWSERLESS_API_KEY` for reliable production Playwright execution. Redline derives the Browserless CDP WebSocket endpoints in code and tries the known regional endpoints before falling back to fetch-only crawling.
- Novus by Pendo is installed in the root layout with the API key from the Novus branch. Set `NEXT_PUBLIC_NOVUS_APP_ID` only if you need to override that key.
- Keep first scans anonymous; GitHub auth is only for saved history and repo analysis.
