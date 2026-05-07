# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**El Futbolero** — a FIFA World Cup 2026 predictions game (polla del mundial) in Spanish. Users predict match scores to earn points and compete on leaderboards and within private leagues.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite is configured. Manual browser testing required for UI changes.

### Supabase

```bash
SUPABASE_DB_PASSWORD=<pwd> supabase db push   # Push local migrations to remote
supabase migration new <name>                  # Create a new migration file
```

Project ref: `pasuasnbgjrtlphtelfq`. DB password and API keys are in memory (`project_infra.md`).

## Stack

- **Next.js 15** (App Router, TypeScript, `src/` directory)
- **Supabase** — PostgreSQL + Auth (Google OAuth) + Realtime
- **Tailwind CSS 4** + **shadcn/ui** (New York style, Lucide icons)
- **Vercel** for deployment (auto-deploys on push to `main`)

Path alias: `@/*` → `./src/*`

## Git workflow

**Always `git fetch origin && git status` before starting work.** The remote may have commits from other sessions. If behind, do `git pull --rebase` before making changes. This avoids merge conflicts on push.

## Architecture

### Auth & Middleware

[src/middleware.ts](src/middleware.ts) refreshes Supabase session cookies on every request and redirects unauthenticated users to `/login?redirectTo=...` for protected routes: `/play`, `/leagues`, `/profile`, `/api/admin`.

OAuth callback: `/auth/callback`. Logout: `/auth/signout`.

### Supabase Clients

Three clients in `src/lib/supabase/`:

| File | Usage |
|------|-------|
| `server.ts` | Server Components & API routes — uses cookies, respects RLS |
| `client.ts` | Client Components (browser) |
| `admin.ts` | Server-only, service role key, **bypasses RLS** — use only in trusted server contexts |

### Pages

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server | Hero landing with 3 match cards (last played, live, next) |
| `/login` | Server | Google OAuth |
| `/play` | Client (`'use client'`) | Enter/edit predictions, auto-saves with debounce, inputs lock 5min before match |
| `/leaderboard` | Server | Global ranking + weekly tabs (Semana 1–4) |
| `/leagues` | Server | Create/join/list user's private leagues |
| `/leagues/[id]` | Server | League-specific leaderboard |
| `/profile/[id]` | Server | Public profile — avatar, stats, match-by-match history |
| `/profile` | Server | Own profile redirect |
| `/rules` | Server | Points system explanation |
| `/admin` | Server | Admin panel (users, leagues, predictions) — restricted to admin user ID |

### Home page match cards (`/`)

`src/app/page.tsx` shows 3 match cards:
- If there's a live match: [last finished, live, next scheduled]
- If no live match: [2nd-last finished, last finished, next scheduled]

Each card shows: label + date (top), flag + team name + prediction box (if user predicted), result row with score + pts badge (if live/finished), status badge (bottom). Fetches user scores and predictions server-side.

### Admin panel (`/admin`)

Protected by hardcoded `ADMIN_USER_ID` in `src/app/admin/page.tsx`. Tabs: Usuarios (searchable), Ligas (league selector + member leaderboard), Predicciones (all predictions with match status).

### Database (Supabase/PostgreSQL)

Key tables: `profiles`, `teams`, `matches`, `predictions`, `scores`, `leagues`, `league_members`, `prizes`.

Migrations in [supabase/migrations/](supabase/migrations/). RLS enabled on all tables.

**Views:**
- `v_leaderboard_general` — all-time global ranking
- `v_leaderboard_weekly` — filtered by `matches.week_number`
- `v_leaderboard_league` — filtered by `league_id`

`is_pleno = true` on a `scores` row means exact score prediction.

### Scoring Pipeline

Points calculated automatically via DB trigger `on_match_score_change` on `matches` (migration `004_scoring_trigger.sql`). Fires when `status`, `team1_score`, or `team2_score` changes:

- `status → 'live'`: calculates scores for all predictors
- Score changes while `'live'`: recalculates in real-time
- `status → 'finished'`: final calculation, sets `is_final = true` — no further updates

**Never manually write to `scores`** — always update `matches` and let the trigger cascade.

Scoring rules (from [RULES.md](RULES.md)):
1. **Winner/draw**: 2 pts (groups) → 7 pts (semis/final)
2. **Goals per team**: 0–1=1pt, 2=2pt, 3=3pt, 4=4pt, 5+=5pt (90-minute result only)

Max per match: 12 pts (groups) → 17 pts (final).

### Live Score Sync

An external cron (cron-job.org) calls `https://futbolero.vercel.app/api/cron/update-scores` every minute during matches.

The route (`src/app/api/cron/update-scores/route.ts`):
1. Fetches a 3-day window (yesterday→tomorrow) from **football-data.org** — wide window handles CET/UTC timezone drift
2. Filters `IN_PLAY`, `PAUSED`, `FINISHED` matches
3. Looks up matches in our DB by `"HOMECODE-AWAYCODE"` TLA key
4. Updates `matches.status`, `team1_score`, `team2_score` via admin client
5. Scoring trigger fires automatically

`teams.code` must match football-data.org TLA codes exactly. Known fixes applied: Atlético Madrid = `ATL` (not `ATM`), Bayern = `FCB` (not `BAY`).

API token: in `FOOTBALL_DATA_API_TOKEN` env var (also in memory `project_infra.md`).

### Prediction Locking

Inputs lock 5 minutes before `match_date`. Enforced client-side in `/play`. The play page re-renders every 30s to enforce deadline as time passes. Locked matches show the predicted score in a read-only box (or 🔒 if no prediction).

### Component Conventions

- Server Components (async) in `app/` for auth checks and initial data fetching
- `'use client'` for interactive components (predictions, admin tabs, header)
- `export const dynamic = 'force-dynamic'` on pages that must not be cached (leaderboard, home, profile, admin)
- UI primitives from `src/components/ui/` (shadcn/ui — don't modify directly; use `npx shadcn add`)
- `cn()` from `@/lib/utils` for conditional class composition

### Styling

Dark theme with gradient backgrounds (`from-slate-950 via-slate-900 to-slate-950`) and glassmorphism (`bg-white/5 border border-white/10 backdrop-blur`). Global tokens in `src/app/globals.css`.

## Removed Features

- **Challenges / Desafíos** — 1v1 duel feature was removed. The `/challenges` page, challenge modal in `/play`, leagueMates fetching, and nav link have all been deleted. The `challenges` DB table still exists in migrations but is unused.
