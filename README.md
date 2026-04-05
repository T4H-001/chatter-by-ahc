# chatter-by-ahc

Say it once. Chatter prepares the people, the systems, and the next move.

## Stack
- **Vercel** serverless functions (Node 20, ESM)
- **Supabase S1** — 8 chat_ tables (schema in `infra/supabase/`)
- **Bridge** — AWS Lambda invoke layer for email, SQL, external routing
- **Google Drive** — SA JSON from env var or `cap_secrets`

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness |
| POST | `/api/chatter/translate` | Classify + produce human/machine outputs |
| POST | `/api/chatter/process-drive-file` | Process a single Drive file object |
| POST | `/api/drive/webhook` | Google Drive push notification receiver |
| POST | `/api/drive/register-watch` | Register Drive changes watch channel |
| GET/POST | `/api/drive/poll` | Cron-driven folder poll (every 30 min) |

## Env vars (set in Vercel)

```
TENANT_KEY=ahc-chatter
SUPABASE_URL=https://lzfgigiyqpuuxslsygjt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
BRIDGE_URL=https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke
BRIDGE_API_KEY=
GOOGLE_SA_JSON=          # full SA JSON as single-line string (or leave blank — pulled from cap_secrets)
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_WEBHOOK_ADDRESS=https://chatter-by-ahc.vercel.app/api/drive/webhook
GOOGLE_DRIVE_WEBHOOK_TOKEN=
POLL_SECRET=             # guards /api/drive/poll
```

## Deploy

```bash
vercel --prod
```

After first deploy, register the Drive watch:
```bash
curl -X POST https://chatter-by-ahc.vercel.app/api/drive/register-watch
```

## Schema
Applied to S1 via bridge — see `infra/supabase/001_schema.sql` + `002_seed.sql`.
