export type MatchSummary = {
    date: string
    opponent: string
    is_home: boolean
    goals_for: number | null
    goals_against: number | null
    result: "W" | "D" | "L" | null
    field: string | null
}

export type TeamScheduleResponse = {
    year: number
    division: string
    team_name: string
    team_slug: string
    pool_name: string | null
    played: MatchSummary[]
    upcoming: MatchSummary[]
}