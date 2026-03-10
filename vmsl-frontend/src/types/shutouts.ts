export type KeeperRow = {
    player_name: string;
    team_name: string;
    shutouts: number;
};
  
export type PoolShutouts = {
    pool_name?: string | null;
    keepers: KeeperRow[];
};
  
export type ShutoutsResponse = {
    year: number;
    division: string;
    pools: PoolShutouts[];
};