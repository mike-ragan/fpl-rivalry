import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import type {
  InferredSeasonRecord,
  LeagueConfig,
  ManagerKey,
  Managers,
  SeasonGameweeks,
} from "./fpl-types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, ...parts), "utf-8")) as T;
}

export function getManagers(): Managers {
  return readJson<Managers>("managers.json");
}

export function getLeague(): LeagueConfig {
  return readJson<LeagueConfig>("league.json");
}

export function getHistoricalSeasons(): InferredSeasonRecord[] {
  return readJson<InferredSeasonRecord[]>("seasons", "historical.json");
}

/** Season directory slugs under data/seasons/ that hold gameweek.json files, e.g. ["2025-26"]. */
export function getLeagueSeasonSlugs(): string[] {
  const seasonsDir = path.join(DATA_DIR, "seasons");
  return readdirSync(seasonsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => existsSync(path.join(seasonsDir, slug, "gameweeks.json")))
    .sort();
}

export function getSeasonGameweeks(slug: string): SeasonGameweeks | null {
  const file = path.join(DATA_DIR, "seasons", slug, "gameweeks.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8")) as SeasonGameweeks;
}

export interface SeasonSummary {
  season: string;
  points: Record<ManagerKey, number>;
  winner: ManagerKey | "tie";
  source: "league" | "inferred";
  slug?: string;
}

/** All completed seasons (both inferred and real-league), sorted oldest to newest. */
export function getCompletedSeasonSummaries(): SeasonSummary[] {
  const historical: SeasonSummary[] = getHistoricalSeasons().map((s) => ({
    season: s.season,
    points: s.points,
    winner: s.winner,
    source: "inferred",
  }));

  const leagueSeasons: SeasonSummary[] = getLeagueSeasonSlugs()
    .map((slug) => ({ slug, data: getSeasonGameweeks(slug) }))
    .filter((s): s is { slug: string; data: SeasonGameweeks } => s.data !== null && s.data.winner !== undefined)
    .map(({ slug, data }) => ({
      season: data.season,
      points: data.points,
      winner: data.winner!,
      source: "league" as const,
      slug,
    }));

  return [...historical, ...leagueSeasons].sort((a, b) => a.season.localeCompare(b.season));
}

/** League seasons still in progress (no winner yet) — for a "current race" link on the home page. */
export function getInProgressSeasonSlugs(): string[] {
  return getLeagueSeasonSlugs().filter((slug) => {
    const data = getSeasonGameweeks(slug);
    return data !== null && data.winner === undefined;
  });
}

export interface RivalrySummary {
  wins: Record<ManagerKey, number>;
  ties: number;
  champion: SeasonSummary | null;
}

export function getRivalrySummary(): RivalrySummary {
  const completed = getCompletedSeasonSummaries();
  const wins: Record<ManagerKey, number> = { mike: 0, jack: 0 };
  let ties = 0;
  for (const s of completed) {
    if (s.winner === "tie") ties += 1;
    else wins[s.winner] += 1;
  }
  const champion = completed.length > 0 ? completed[completed.length - 1] : null;
  return { wins, ties, champion };
}
