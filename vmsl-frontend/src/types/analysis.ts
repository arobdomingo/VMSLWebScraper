import type { MatchSummary } from './schedule';
import type { Team } from './teams';
export type VenueSplit = {
    games_played: number; wins: number; draws: number; losses: number;
    goals_for: number; goals_against: number; clean_sheets: number;
    points_per_game: number | null; gf_per_game: number | null; ga_per_game: number | null;
};
export type Comparison = {
    team_name: string; team_slug: string; pool_name: string | null; position: number;
    points_per_game: number | null; gf_per_game: number | null; ga_per_game: number | null;
    form: MatchSummary[];
};
export type TeamAnalysis = {
    team: Comparison; home: VenueSplit; away: VenueSplit; opponents: Team[];
    opponent: Comparison | null; meetings: MatchSummary[];
    next_difficulty: { label: string; opponent_ppg: number | null; opponent_games: number } | null;
};
