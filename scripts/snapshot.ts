/**
 * Recurring snapshot. Run via `npm run snapshot` (invoked weekly by
 * .github/workflows/snapshot.yml). Fetches both managers' current-season
 * gameweek history from the FPL API and rewrites
 * data/seasons/<slug>/gameweeks.json. The GitHub Actions workflow decides
 * whether anything actually changed and commits accordingly.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchEntryHistory, fetchLeagueStandings, seasonSlug } from "./fpl-api";
import type {
  GameweekEntry,
  LeagueConfig,
  ManagerKey,
  Managers,
  SeasonGameweeks,
} from "../lib/fpl-types";

const DATA_DIR = path.join(__dirname, "..", "data");
const TOTAL_GAMEWEEKS = 38;

function winnerOf(points: Record<ManagerKey, number>): ManagerKey | "tie" {
  if (points.mike === points.jack) return "tie";
  return points.mike > points.jack ? "mike" : "jack";
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf-8")) as T;
}

async function main() {
  const league = await readJson<LeagueConfig>(path.join(DATA_DIR, "league.json"));
  const managers = await readJson<Managers>(path.join(DATA_DIR, "managers.json"));

  console.log(`Snapshotting season ${league.currentSeason}...`);
  const [mikeHistory, jackHistory] = await Promise.all([
    fetchEntryHistory(managers.mike.entryId),
    fetchEntryHistory(managers.jack.entryId),
  ]);

  if (mikeHistory.current.length === 0 || jackHistory.current.length === 0) {
    console.log("No current-season gameweek data yet (pre-season) — nothing to snapshot.");
    return;
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
    const standings = await fetchLeagueStandings(league.leagueId);
    const byEntry = new Map(standings.standings.results.map((r) => [r.entry, r.total]));
    points = {
      mike: byEntry.get(managers.mike.entryId) ?? mikeHistory.current.at(-1)!.total_points,
      jack: byEntry.get(managers.jack.entryId) ?? jackHistory.current.at(-1)!.total_points,
    };
  } catch {
    points = {
      mike: mikeHistory.current.at(-1)!.total_points,
      jack: jackHistory.current.at(-1)!.total_points,
    };
  }

  const isSeasonComplete =
    mikeHistory.current.length >= TOTAL_GAMEWEEKS &&
    jackHistory.current.length >= TOTAL_GAMEWEEKS;

  const seasonGameweeks: SeasonGameweeks = {
    season: league.currentSeason,
    source: "league",
    ...(isSeasonComplete ? { winner: winnerOf(points) } : {}),
    points,
    gameweeks: {
      mike: toGameweeks(mikeHistory.current),
      jack: toGameweeks(jackHistory.current),
    },
  };

  const seasonDir = path.join(DATA_DIR, "seasons", seasonSlug(league.currentSeason));
  await mkdir(seasonDir, { recursive: true });
  await writeFile(
    path.join(seasonDir, "gameweeks.json"),
    JSON.stringify(seasonGameweeks, null, 2) + "\n",
  );

  console.log(
    `Wrote data/seasons/${seasonSlug(league.currentSeason)}/gameweeks.json ` +
      `(${seasonGameweeks.gameweeks.mike.length} gameweeks` +
      (isSeasonComplete ? `, season complete, winner: ${seasonGameweeks.winner})` : ")"),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
