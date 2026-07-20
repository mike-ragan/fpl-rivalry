const BASE_URL = "https://fantasy.premierleague.com/api";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) fpl-rivalry-tracker/1.0";

export interface RawGameweekEntry {
  event: number;
  points: number;
  total_points: number;
  rank: number | null;
}

export interface RawPastSeason {
  season_name: string;
  total_points: number;
  rank: number;
  rank_percentage: number;
}

export interface RawEntryHistory {
  current: RawGameweekEntry[];
  past: RawPastSeason[];
}

export interface RawLeagueStandingsResult {
  entry: number;
  player_name: string;
  entry_name: string;
  rank: number;
  total: number;
}

export interface RawLeagueStandings {
  league: { id: number; name: string };
  standings: { results: RawLeagueStandingsResult[] };
}

async function fplFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`FPL API request failed: ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchEntryHistory(entryId: number): Promise<RawEntryHistory> {
  return fplFetch<RawEntryHistory>(`/entry/${entryId}/history/`);
}

export function fetchLeagueStandings(
  leagueId: number,
): Promise<RawLeagueStandings> {
  return fplFetch<RawLeagueStandings>(`/leagues-classic/${leagueId}/standings/`);
}

/** "2025/26" -> "2025-26", for filesystem-safe directory names. */
export function seasonSlug(season: string): string {
  return season.replace("/", "-");
}
