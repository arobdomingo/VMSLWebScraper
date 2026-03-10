export type MvpRow = {
    player_name: string
    team_name: string
    mvps: number
}

export type PoolMvps = {
    pool_name: string | null
    player_mvps: MvpRow[]
}

export type MvpsResponse = {
    year: number
    division: string
    pools: PoolMvps[]
}