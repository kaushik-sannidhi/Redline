# Appwrite Backend Schema

Create one Appwrite project with GitHub OAuth enabled, then create a database and two TablesDB tables. Use the table IDs in `.env.local`.

## Environment IDs

- `APPWRITE_DATABASE_ID`: database that stores Redline data.
- `APPWRITE_SCANS_TABLE_ID`: scans table.
- `APPWRITE_BADGES_TABLE_ID`: badges table.

## `scans` Table

Suggested table ID: `scans`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `hash` | string | yes | Public scan hash, index this column for exact lookup. |
| `url` | string | yes | Scanned URL. |
| `repoUrl` | string | no | Optional GitHub repo URL. |
| `stackJson` | string | yes | JSON string array of detected stack tags. |
| `score` | integer | yes | Current score, 0-100. |
| `findingsJson` | string | yes | JSON string array of findings. |
| `summaryJson` | string | yes | JSON string summary counts. |
| `userId` | string | no | Appwrite user ID for saved history. |
| `status` | string | yes | `pending`, `running`, `complete`, or `error`. |
| `error` | string | no | Scan failure message. |
| `previousScore` | integer | no | Prior scan score for rescans. |
| `createdAt` | datetime | yes | App-created timestamp. |
| `completedAt` | datetime | no | Completion timestamp. |
| `isPublic` | boolean | yes | Public reports are enabled by default. |

Recommended indexes:

- `hash`: key index on `hash`
- `user_history`: key index on `userId`

## `badges` Table

Suggested table ID: `badges`

| Column | Type | Required | Notes |
|---|---|---:|---|
| `scanHash` | string | yes | Scan hash, index this column for exact lookup. |
| `lastScore` | integer | yes | Cached badge score. |
| `lastScannedAt` | datetime | yes | Last completed scan time. |

Recommended indexes:

- `scan_hash`: key index on `scanHash`

## Permissions

The app uses the server API key for scan and badge reads/writes, so table permissions can be restricted to server integrations. Appwrite Auth sessions are still used to identify the current user for dashboard history, rescans, and GitHub repo analysis.
