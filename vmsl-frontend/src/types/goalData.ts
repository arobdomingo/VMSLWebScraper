export type GoalDiffPoint = {
    date: string;
    gd: number;
}

export type MatchSummary = {
    date: string;
    opponent: string;

    is_home: boolean;
    goals_for: number | null;
    goals_against: number | null;
    result: "W" | "D" | "L" | null;
    field: string | null;
}

export type GoalDataInsights = {
    team_name: string;
    team_slug: string;
  
    biggest_win: MatchSummary | null;
    biggest_loss: MatchSummary | null;
  
    gf_over_two: number;
    ga_under_one: number;
    clean_sheets: number;
  
    trend: GoalDiffPoint[];
}

export type TeamGoalData = {
    team_name: string;
    team_slug: string;
    pool_name: string | null;
  
    games_played: number;
    goals_for: number;
    goals_against: number;
    goal_diff: number;
  
    gf_per_game: number;
    ga_per_game: number;
    gd_per_game: number;
}

export type GoalDataResponse = {
    year: number;
    division: string;
    teams: TeamGoalData[];
    insights: GoalDataInsights | null;
}