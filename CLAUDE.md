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
| `/play` | Client (`'use client'`) | Enter/edit predictions, auto-saves with debounce, inputs lock 5min before match. Upcoming matches shown first; past matches collapsible under "Jugados" button. |
| `/leaderboard` | Server | Global ranking + "Partido en Juego" tab (live match predictions + position changes) |
| `/leagues` | Server | Create/join/list user's private leagues |
| `/leagues/[id]` | Server | League-specific leaderboard |
| `/profile/[id]` | Server | Public profile — avatar, stats, match-by-match history |
| `/play/[id]` | Client (`'use client'`) | Match detail — edit own prediction (if not started), see all predictions + scores after match starts |
| `/profile` | Server | Own profile redirect |
| `/rules` | Server | Points system explanation + cuota info |
| `/premios` | Server | Prizes page — sponsor notice + pozo info |
| `/admin` | Server | Admin panel — restricted to `felipe@rayalab.cl` |

### Home page match cards (`/`)

`src/app/page.tsx` shows 3 match cards:
- If there's a live match: [last finished, live, next scheduled]
- If no live match: [2nd-last finished, last finished, next scheduled]

Each card shows: label + date (top), flag + team name + prediction box (if user predicted), result row with score + pts badge (if live/finished), status badge (bottom). Fetches user scores and predictions server-side.

### Admin API (`/api/admin/match`)

Protected by `Authorization: Bearer <ADMIN_SECRET>` via `src/lib/auth-admin.ts` (`verifyAdminToken` uses `timingSafeEqual` to prevent timing attacks).

- `POST` — set a match `live` or `finished` (with scores). Triggers the scoring DB function.
- `GET ?id=X` — inspect current match state.

Use this to manually override a match when the automatic cron fails or for testing.

### Admin panel (`/admin`)

Protected by hardcoded `ADMIN_EMAIL` in `src/app/admin/page.tsx`. Two tabs:

- **Jugadores** — lists all registered users with email, avatar, `has_paid` toggle (persisted to DB), and inline-editable `notes` field (free text, e.g. "amigo de Felipe"). Uses Server Actions in `src/app/admin/actions.ts`.
- **Predicciones** — match-by-match view of all predictions with Pleno / Ganador / Error badges.

Client components: `AdminTabs.tsx` (tab switcher), `AdminUsersPanel.tsx` (users list with optimistic UI). Both use Server Actions (`togglePaid`, `updateNotes`) that call `revalidatePath('/admin')` after each mutation.

### Database (Supabase/PostgreSQL)

Key tables: `profiles`, `teams`, `matches`, `predictions`, `scores`, `leagues`, `league_members`, `prizes`.

**`profiles` admin fields** (added migration `015_profile_admin_fields.sql`):
- `has_paid boolean DEFAULT false` — toggled from admin panel to track cuota payment
- `notes text` — free-text admin note per player (e.g. relationship to group)

Migrations in [supabase/migrations/](supabase/migrations/). RLS enabled on all tables.

**Views:**
- `v_leaderboard_general` — all-time global ranking (includes live match points — trigger fires in real time)
- `v_leaderboard_weekly` — filtered by `matches.week_number` (exists in DB but unused in frontend)
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

An external cron (**cron-job.org**) calls `https://futbolero.vercel.app/api/cron/update-scores` every minute during matches.

**Manual activation checklist (do before each match day):**
1. Log in to cron-job.org and verify the job is **enabled** (not paused)
2. URL must be: `https://futbolero.vercel.app/api/cron/update-scores`
3. Header must be: `Authorization: Bearer <ADMIN_SECRET>`
   - To get the secret: Vercel dashboard → Project → Settings → Environment Variables → `ADMIN_SECRET`
4. No Vercel cron is configured (`vercel.json` is empty) — cron-job.org is the only scheduler

The route (`src/app/api/cron/update-scores/route.ts`):
1. Fetches a 3-day window (yesterday→tomorrow) from **football-data.org** — wide window handles CET/UTC timezone drift
2. Filters `IN_PLAY`, `PAUSED`, `FINISHED` matches
3. Looks up matches in our DB by `"HOMECODE-AWAYCODE"` TLA key
4. Updates `matches.status`, `team1_score`, `team2_score` via admin client
5. Scoring trigger fires automatically

`teams.code` must match football-data.org TLA codes exactly. When they don't, add an override to `FD_TLA_OVERRIDES` in `src/lib/football-api.ts` (e.g. `BAY → FCB` for Bayern) — never rename the DB code to match the API. The flag emoji map also lives in `src/app/play/[id]/page.tsx` and must be updated when adding new teams.

API token: in `FOOTBALL_DATA_API_KEY` env var (also in memory `project_infra.md`).

### Play page (`/play`) — layout

Matches are split within each phase tab:
- **Upcoming/live** — shown at the top, fully editable or locked as appropriate.
- **Jugados (X)** — full-width collapsible button reveals past matches below. Auto-expands when the phase has no upcoming matches.

On load, `activePhase` is set to the first phase that still has non-finished matches (not always "Grupos").

Past match cards show:
- Disabled score inputs with the user's prediction
- A `Resultado | X — Y | N pts ⭐` row (same pattern as the home page), sourced from the `scores` table loaded in parallel with predictions and matches.

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

### Leaderboard — tab "Partido en Juego"

`/leaderboard?tab=live` — visible always; shows live match data only when `matches.status = 'live'`.

- **Score card** at top: teams + flags + live score with pulsing red "EN VIVO" badge.
- **Ranking table (general)**: # | Jugador | Pts | Plenos | ↕ — "Partidos" column removed to make room.
- **↕ column (general tab)**: position change vs ranking before the last finished match. Computed by fetching that match's `scores`, subtracting from each user's `total_points`, re-sorting, and diffing positions. Arrow ↑ green / ↓ red / `—` neutral; previous position shown below the arrow (e.g. `5°`).
- **Ranking table (live tab)**: # | Jugador | Pts | Pronóstico | +Pts | ↕
  - **Pts Actuales** — `total_points` from `v_leaderboard_general`, which already includes live-match points (trigger recalculates on every score change).
  - **Pronóstico** — the user's prediction for the live match (`predictions.team1_score – team2_score`).
  - **+Pts** — points earned from this match specifically (`scores.points` for that `match_id`), shown in emerald; `—` if not yet calculated.
- Only players who predicted the live match appear in this tab.
- Data uses two parallel admin-client queries (predictions + scores by `match_id`) — no FK between those tables, so they cannot be nested in one Supabase select.
- The tab shows a pulsing red dot when a live match exists.
- **↕ column (live tab)**: compares each predictor's position before vs after live match points. Computed in JS by re-sorting predictors on `total_points - match_points` and diffing against current order.
- **Pleno highlight**: players with `is_pleno = true` on their live match score get a gold left-border row, yellow name + ⭐, and the +Pts column shows `⭐ +N` in yellow. Requires fetching `is_pleno` from `scores` alongside `points`.

## Removed Features

- **Challenges / Desafíos** — 1v1 duel feature was removed. The `/challenges` page, challenge modal in `/play`, leagueMates fetching, and nav link have all been deleted. The `challenges` DB table still exists in migrations but is unused.
