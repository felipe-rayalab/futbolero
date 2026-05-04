# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

El Futbolero is a FIFA World Cup 2026 prediction game. Users predict match scores, earn points, compete globally or inside private leagues, and challenge each other 1v1.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

There are no automated tests. Manual browser testing is required for UI changes.

### Supabase migrations

```bash
supabase db push          # Apply local migrations to remote
supabase migration new <name>   # Create a new migration file
```

### Triggering scoring manually (admin)

```bash
# Mark match finished and calculate scores
curl -X POST https://<host>/api/admin/match \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"matchId": 1, "team1Score": 2, "team2Score": 1, "status": "finished"}'
```

## Environment Variables

See `.env.example`. Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS |
| `ADMIN_SECRET` | Bearer token for `/api/admin/*` routes |
| `FOOTBALL_DATA_API_KEY` | football-data.org live scores API |

## Architecture

**Stack:** Next.js (App Router) + TypeScript + Supabase (Postgres + Auth) + Tailwind CSS + shadcn/ui. Deployed on Vercel.

### Supabase client usage

Three separate clients in `src/lib/supabase/`:
- `server.ts` — `createClient()` for Server Components and API routes (uses cookies, respects RLS)
- `client.ts` — browser-side client for Client Components
- `admin.ts` — `createAdminClient()` with service role key, bypasses RLS — only use for server-side scoring/admin operations

### API routes

- `POST /api/admin/match` — updates match status/scores and calls the DB scoring function. Protected by `ADMIN_SECRET` via timing-safe comparison in `src/lib/auth-admin.ts`.
- `GET /api/cron/update-scores` — polls football-data.org for live match data and triggers scoring. Called every minute by a cron job (Vercel Pro or cron-job.org) during the tournament.

### Scoring logic

Implemented entirely in the database as `calculate_and_save_scores(p_match_id uuid)` (see `supabase/migrations/`). Points are awarded as follows:

- **Winner/draw points** by phase: Groups=2, Round32/16=3, Quarters/Semis=5, Semis/3rd/Final=7
- **Goal points** per team: 0–1 goals=1pt, 2=2pt, 3=3pt, 4=4pt, 5+=5pt
- A "pleno" (exact score prediction) is flagged on the `scores` row

Tiebreaker order: total points → pleno count → max single-match score.

### Leaderboards

Two Postgres views: `v_leaderboard_general` (all-time) and `v_leaderboard_weekly` (scoped by `week_number` on matches). Both join `profiles → scores → matches`.

### Prediction deadline

Enforced in the UI at `/play/[id]`: predictions are locked 5 minutes before `match_date`. Deadline is checked client-side only.

### Key data

- 48 teams with 3-letter TLA codes matching football-data.org's API
- 72 group stage matches seeded in migrations 005–006
- Knockout fixtures must be added manually as results come in (not yet implemented)

### Middleware

`src/middleware.ts` refreshes Supabase session cookies on every request and redirects unauthenticated users away from protected routes (`/play`, `/leagues`, `/challenges`, `/profile`).

## Pending Work (from TODO.md)

- Knockout phase fixtures (Round of 32 → Final) — add once group stage concludes
- Push/email notifications for challenge invites
- Avatar upload to Supabase Storage
- Pre-tournament checklist: verify TLA mapping, activate cron, test with a sample match
