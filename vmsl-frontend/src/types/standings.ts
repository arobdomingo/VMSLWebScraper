export type StandingsTeamRow = {
    position: number;
    team_name: string;
    points: number;
    games_played: number;
    wins: number;
    draws: number;  
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_diff: number;
};

export type StandingsPool = {
    pool_name: string | null;
    teams: StandingsTeamRow[];
};

export type StandingsResponse = {
    year: number;
    division: string;
    pools: StandingsPool[];
};