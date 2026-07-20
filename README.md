# FPL Rivalry Tracker

A small dashboard for the "You Can Write It Down" Fantasy Premier League mini-league — a
long-running head-to-head between two managers, Mike and Jack.

- **Live**: current champion (most recent completed season's winner) and the all-time win
  record, at [`app/page.tsx`](app/page.tsx).
- **Per-season detail**: cumulative points race by gameweek, current gap, and lead-change
  count, at [`app/season/[season]/page.tsx`](app/season/%5Bseason%5D/page.tsx).

## Data model

Everything lives as static JSON under `data/` — no database. Each season has a `source`:

- **`league`** — a real result from the mini-league itself (league ID `282043`, created July
  2025). Stored per-season in `data/seasons/<slug>/gameweeks.json` with full gameweek-by-gameweek
  detail.
- **`inferred`** — seasons before the league existed. FPL classic leagues rank purely by total
  points, so each manager's own season-total archive (`/api/entry/{id}/history/`, which goes
  back to account creation) can reconstruct who'd have "won" that season even without a shared
  league. Stored in `data/seasons/historical.json`. These only carry a final score, not
  gameweek-by-gameweek detail, since that level of granularity isn't retained by the FPL API
  past the current season.

`data/league.json` holds the league ID and the `currentSeason` string (e.g. `"2026/27"`) —
bumped manually once a year when a new season starts.

## Scripts

- **`npm run backfill`** (`scripts/backfill.ts`) — one-time. Fetches both managers' full FPL
  history and (re)writes `data/managers.json`, `data/league.json`,
  `data/seasons/historical.json`, and the current season's `gameweeks.json`. Already run once
  to seed 2014/15–2025/26; re-running it would overwrite the current season's file with
  whatever the FPL API still exposes, so in practice `snapshot` is what keeps things current.
- **`npm run snapshot`** (`scripts/snapshot.ts`) — recurring. Fetches the current season's
  gameweek data for both managers and rewrites `data/seasons/<slug>/gameweeks.json`. Marks the
  season complete (`winner` field set) once both managers have 38 gameweeks recorded.

## Automation

[`.github/workflows/snapshot.yml`](.github/workflows/snapshot.yml) runs `npm run snapshot`
weekly (Tuesdays, after weekend fixtures and bonus points finalize) via GitHub Actions, and
commits+pushes `data/` if anything changed. Vercel's git integration then redeploys
automatically on push — there's no serverless cron on the Vercel side. Can also be triggered
manually from the Actions tab (`workflow_dispatch`).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Connected to Vercel via git integration — every push to `main` (including the weekly snapshot
commits) triggers a redeploy.
