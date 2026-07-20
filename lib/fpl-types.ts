export type ManagerKey = "mike" | "jack";

export interface ManagerInfo {
  entryId: number;
  name: string;
  teamName: string;
}

export type Managers = Record<ManagerKey, ManagerInfo>;

export interface LeagueConfig {
  leagueId: number;
  leagueName: string;
  /** Slash-formatted season string, e.g. "2025/26". Bumped manually once a year. */
  currentSeason: string;
}

/** A season result reconstructed from each manager's overall season total (no shared league existed yet). */
export interface InferredSeasonRecord {
  season: string;
  points: Record<ManagerKey, number>;
  winner: ManagerKey | "tie";
  source: "inferred";
}

export interface GameweekEntry {
  event: number;
  points: number;
  totalPoints: number;
  rank: number | null;
}

export interface SeasonGameweeks {
  season: string;
  source: "league";
  /** Set once the season has finished; absent while still in progress. */
  winner?: ManagerKey | "tie";
  points: Record<ManagerKey, number>;
  gameweeks: Record<ManagerKey, GameweekEntry[]>;
}

export type SeasonRecord = InferredSeasonRecord | SeasonGameweeks;
