export type ScorerRow = {

    player_name: string,
    team_name: string;
    goals: number;

}

export type PoolScorers = {

    pool_name: string | null;
    scorers: ScorerRow[];

}

export type ScorersResponse = {
    
    year: number;
    division: string;
    pools: PoolScorers[];

}