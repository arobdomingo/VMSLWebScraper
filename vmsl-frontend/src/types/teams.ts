export type Team = {

    team_name: string
    team_slug: string
    pool_name?: string | null

}

export type TeamsResponse = {

    year: number
    division: string
    teams: Team[]

}