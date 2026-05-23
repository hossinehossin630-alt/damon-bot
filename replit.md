# DAMON Bot

A Facebook Messenger userbot powered by fca-unofficial (dongdev) with a real-time cyberpunk admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server + bot (port 8080)
- `pnpm --filter @workspace/panel run dev` — run the admin panel (port 19076)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Bot: fca-unofficial (dongdev), c3c JSON cookie format
- API: Express 5 + Socket.io
- File watching: chokidar (cookie hot-reload watchdog)
- DB: PostgreSQL + Drizzle ORM (not yet used — data stored in JSON files)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind, wouter, TanStack Query

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `artifacts/api-server/src/bot/` — Bot core, commands, events, watchdog
- `artifacts/api-server/src/bot/core.ts` — fca-unofficial login, hot-reload
- `artifacts/api-server/src/bot/commands/` — Bot commands (/uptime, /ping, /help, /myid)
- `artifacts/api-server/src/bot/watchdog.ts` — chokidar cookie file watcher
- `artifacts/api-server/src/bot/admin.ts` — Admin CRUD (reads/writes data/admins.json)
- `artifacts/api-server/data/` — Runtime data (cookie.json, admins.json, cookie-meta.json)
- `artifacts/panel/src/` — Admin panel frontend

## Architecture decisions

- Cookie stored as c3c JSON format (array of cookie objects) in `data/cookie.json` — NOT the m_sees format
- Cookie watchdog uses chokidar with debounce to detect external changes and hot-reload the bot without stopping the server
- fca-unofficial is externalized from esbuild bundle (complex CJS with dynamic requires) — loaded at runtime via `createRequire`
- Socket.io path is `/api/socket.io` so it routes through the shared proxy
- Bot only responds to users in `data/admins.json` — all other senders are silently ignored
- Bot data (cookie, admins) stored as JSON files in `data/` relative to api-server's `process.cwd()`

## Product

- **Dashboard**: Real-time bot status, uptime, UID, connection type (mqtt/poll), admin count
- **Admins**: Add/remove bot admins by Facebook UID and display name
- **Cookie**: View current cookie status (masked), paste new c3c JSON cookie — bot reloads automatically
- **Live Logs**: Streaming log terminal with level coloring (INFO/WARN/ERROR/OK), auto-scroll
- **HOT_RELOAD**: Manual hot-reload button without stopping the Express server
- **Cookie Watchdog**: If `cookie.json` is changed externally, bot auto-reloads the session

## Getting Started

1. Open the panel at the preview URL
2. Go to **Admins** → add your Facebook UID (you can get it via /myid once logged in, or from your profile URL)
3. Go to **Cookie** → paste your c3c JSON cookie (exported from browser using a cookie export extension in JSON format)
4. Bot connects automatically — check Dashboard for ONLINE status

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `fca-unofficial` and `chokidar` are marked external in build.mjs — they must be installed as regular dependencies
- Cookie must be c3c JSON array format, NOT the old m_sees appstate format
- The bot only replies to registered admins — add yourself first via the panel
- DATA_DIR defaults to `path.join(process.cwd(), "data")` = `artifacts/api-server/data/` in dev

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
