/**
 * One-time backfill. Run via `npm run backfill`.
 *
 * Pulls each manager's full FPL history and writes:
 *  - data/managers.json
 *  - data/league.json
 *  - data/seasons/historical.json      (inferred pre-league seasons, from points comparison)
 *  - data/seasons/<slug>/gameweeks.json (full gameweek-by-gameweek detail for the season the league covers)
 *
 * Time-sensitive: the FPL API only exposes full gameweek detail for the *current* season.
 * Once next season's GW1 kicks off, this season's detail collapses into a totals-only
 * "past" entry. Run this before then.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  fetchEntryHistory,
  fetchLeagueStandings,
  seasonSlug,
  type RawPastSeason,
} from "./fpl-api";
import type {
  GameweekEntry,
  InferredSeasonRecord,
  LeagueConfig,
  ManagerKey,
  Managers,
  SeasonGameweeks,
} from "../lib/fpl-types";

const DATA_DIR = path.join(__dirname, "..", "data");

const LEAGUE: LeagueConfig = {
  leagueId: 282043,
  leagueName: "You Can Write It Down",
  currentSeason: "2025/26",
};

const MANAGERS: Managers = {
  mike: {
    entryId: 562621,
    name: "Mike Ragan Wolfe",
    initials: "MJRW",
    teamName: "TadicYouCantScratch",
  },
  jack: {
    entryId: 1446347,
    name: "Jack Dunwell",
    initials: "JD",
    teamName: "Rambags",
  },
};

function winnerOf(points: Record<ManagerKey, number>): ManagerKey | "tie" {
  if (points.mike === points.jack) return "tie";
  return points.mike > points.jack ? "mike" : "jack";
}

function buildHistoricalSeasons(
  mikePast: RawPastSeason[],
  jackPast: RawPastSeason[],
): InferredSeasonRecord[] {
  const jackBySeason = new Map(jackPast.map((s) => [s.season_name, s]));

  const records: InferredSeasonRecord[] = [];
  for (const mikeSeason of mikePast) {
    // The league's own season is real data, not inferred — skip it here.
    if (mikeSeason.season_name === LEAGUE.currentSeason) continue;

    const jackSeason = jackBySeason.get(mikeSeason.season_name);
    if (!jackSeason) continue; // no overlap this year

    const points: Record<ManagerKey, number> = {
      mike: mikeSeason.total_points,
      jack: jackSeason.total_points,
    };
    records.push({
      season: mikeSeason.season_name,
      points,
      winner: winnerOf(points),
      source: "inferred",
    });
  }

  records.sort((a, b) => a.season.localeCompare(b.season));
  return records;
}

async function main() {
  console.log("Fetching manager histories...");
  const [mikeHistory, jackHistory] = await Promise.all([
    fetchEntryHistory(MANAGERS.mike.entryId),
    fetchEntryHistory(MANAGERS.jack.entryId),
  ]);

  const historical = buildHistoricalSeasons(mikeHistory.past, jackHistory.past);
  console.log(
    `Built ${historical.length} inferred historical seasons (${historical[0]?.season} - ${
      historical[historical.length - 1]?.season
    })`,
  );

  if (mikeHistory.current.length === 0 || jackHistory.current.length === 0) {
    throw new Error(
      "One or both managers have an empty 'current' array — the current-season gameweek " +
        "backfill window may have already closed. Check the FPL API response manually.",
    );
  }

  const toGameweeks = (entries: typeof mikeHistory.current): GameweekEntry[] =>
    entries.map((e) => ({
      event: e.event,
      points: e.points,
      totalPoints: e.total_points,
      rank: e.rank,
    }));

  let points: Record<ManagerKey, number>;
  try {
    const standings = await fetchLeagueStandings(LEAGUE.leagueId);
    const byEntry = new Map(standings.standings.results.map((r) => [r.entry, r.total]));
    points = {
      mike: byEntry.get(MANAGERS.mike.entryId) ?? mikeHistory.current.at(-1)!.total_points,
      jack: byEntry.get(MANAGERS.jack.entryId) ?? jackHistory.current.at(-1)!.total_points,
    };
  } catch {
    // Fall back to each manager's own final gameweek total if the league endpoint is unreachable.
    points = {
      mike: mikeHistory.current.at(-1)!.total_points,
      jack: jackHistory.current.at(-1)!.total_points,
    };
  }

  const seasonGameweeks: SeasonGameweeks = {
    season: LEAGUE.currentSeason,
    source: "league",
    winner: winnerOf(points),
    points,
    gameweeks: {
      mike: toGameweeks(mikeHistory.current),
      jack: toGameweeks(jackHistory.current),
    },
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "managers.json"),
    JSON.stringify(MANAGERS, null, 2) + "\n",
  );
  await writeFile(
    path.join(DATA_DIR, "league.json"),
    JSON.stringify(LEAGUE, null, 2) + "\n",
  );
  await writeFile(
    path.join(DATA_DIR, "seasons", "historical.json"),
    JSON.stringify(historical, null, 2) + "\n",
  );

  const seasonDir = path.join(DATA_DIR, "seasons", seasonSlug(LEAGUE.currentSeason));
  await mkdir(seasonDir, { recursive: true });
  await writeFile(
    path.join(seasonDir, "gameweeks.json"),
    JSON.stringify(seasonGameweeks, null, 2) + "\n",
  );

  console.log(`Wrote data/managers.json, data/league.json, data/seasons/historical.json`);
  console.log(
    `Wrote data/seasons/${seasonSlug(LEAGUE.currentSeason)}/gameweeks.json ` +
      `(${seasonGameweeks.gameweeks.mike.length} gameweeks, winner: ${seasonGameweeks.winner})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
